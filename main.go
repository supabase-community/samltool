package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/xml"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"syscall/js"
	"time"

	"github.com/beevik/etree"
	"github.com/hf/saml"
	"github.com/hf/saml/samlsp"
)

func main() {
	c := make(chan struct{})

	js.Global().Set("__samltool", library(c))

	<-c
}

func library(c chan struct{}) any {
	return map[string]interface{}{
		"genprovider": js.FuncOf(genprovider),
		"parsexml":    js.FuncOf(parsexml),
		"makexml":     js.FuncOf(makexml),
		"sso":         js.FuncOf(sso),
	}
}

func returnError(err error) any {
	return map[string]interface{}{
		"error": err.Error(),
	}
}

func returnResult(data interface{}) any {
	return map[string]interface{}{
		"ok": data,
	}
}

func genid() string {
	buf := make([]byte, 12)
	n, err := rand.Read(buf)
	if err != nil {
		panic(err)
	}

	return base64.RawURLEncoding.EncodeToString(buf[:n])
}

func genprovider(this js.Value, args []js.Value) any {
	id := genid()
	flavor := args[0].String()

	pkcs8 := make([]byte, args[1].Length())
	n := js.CopyBytesToGo(pkcs8, args[1])
	pkcs8 = pkcs8[:n]

	privateKey, err := x509.ParsePKCS8PrivateKey(pkcs8)
	if err != nil {
		return returnError(err)
	}

	rsaPrivateKey := privateKey.(*rsa.PrivateKey)

	notBefore := time.UnixMilli(0).UTC()
	notAfter := time.UnixMilli(0).AddDate(200, 0, 0)

	switch flavor {
	case "gsuite":
		notBefore = time.Now().UTC()
		notAfter = notBefore.AddDate(5, 0, 0)
	}

	certTemplate := &x509.Certificate{
		SerialNumber: big.NewInt(0),
		IsCA:         false,
		KeyUsage:     x509.KeyUsageDigitalSignature,
		NotBefore:    notBefore,
		NotAfter:     notAfter,
	}

	certDer, err := x509.CreateCertificate(nil, certTemplate, certTemplate, rsaPrivateKey.Public(), rsaPrivateKey)
	if err != nil {
		return returnError(err)
	}

	cert, err := x509.ParseCertificate(certDer)
	if err != nil {
		return returnError(err)
	}

	entityID, _ := url.ParseRequestURI(args[2].String())
	ssoURL, _ := url.ParseRequestURI(args[3].String())
	sloURL, _ := url.ParseRequestURI(args[4].String())

	idp := saml.IdentityProvider{
		Key:         rsaPrivateKey,
		Certificate: cert,

		MetadataURL: *entityID,
		SSOURL:      *ssoURL,
		LogoutURL:   *sloURL,
	}

	metadata := idp.Metadata()

	switch flavor {
	case "gsuite":
		metadata.ValidUntil = notAfter
		metadata.IDPSSODescriptors[0].SSODescriptor.RoleDescriptor.KeyDescriptors = metadata.IDPSSODescriptors[0].SSODescriptor.RoleDescriptor.KeyDescriptors[:1]
		metadata.IDPSSODescriptors[0].SSODescriptor.NameIDFormats = []saml.NameIDFormat{
			saml.NameIDFormat("urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"),
		}
	}

	metadataXML, err := xml.MarshalIndent(metadata, "", "\t")
	if err != nil {
		return returnError(err)
	}

	return returnResult(map[string]interface{}{
		"flavor":     flavor,
		"id":         id,
		"cert":       base64.StdEncoding.EncodeToString(certDer),
		"metadata":   string(metadataXML),
		"entityID":   entityID.String(),
		"ssoURL":     ssoURL.String(),
		"sloURL":     sloURL.String(),
		"privateKey": base64.StdEncoding.EncodeToString(pkcs8),
		"notBefore":  notBefore.Format(time.RFC3339),
		"notAfter":   notAfter.Format(time.RFC3339),
	})
}

func parsexml(this js.Value, args []js.Value) any {
	var data any

	switch args[0].String() {
	case "request":
		var request saml.AuthnRequest

		if err := xml.Unmarshal([]byte(args[1].String()), &request); err != nil {
			return returnError(err)
		}

		data = request

	case "assertion":
		var assertion saml.Assertion

		if err := xml.Unmarshal([]byte(args[1].String()), &assertion); err != nil {
			return returnError(err)
		}

		data = assertion

	case "metadata":
		metadata, err := samlsp.ParseMetadata([]byte(args[1].String()))
		if err != nil {
			return returnError(err)
		}

		data = metadata

	default:
		return nil
	}

	jsonOut, err := json.Marshal(&data)
	if err != nil {
		return returnError(err)
	}

	xmlOut, err := xml.MarshalIndent(&data, "", "\t")
	if err != nil {
		return returnError(err)
	}

	return returnResult(map[string]interface{}{
		"json":   string(jsonOut),
		"indent": string(xmlOut),
	})
}

func makexml(this js.Value, args []js.Value) any {
	var data interface{}

	switch args[0].String() {
	case "metadata":
		var metadata saml.EntityDescriptor

		if err := json.Unmarshal([]byte(args[1].String()), &metadata); err != nil {
			return returnError(err)
		}

		data = &metadata
	}

	xmlData, err := xml.MarshalIndent(data, "", "  ")
	if err != nil {
		return returnError(err)
	}

	return returnResult(map[string]interface{}{
		"xml": string(xmlData),
	})
}

type providerSpec struct {
	Certificate []byte `json:"cert"`
	PrivateKey  []byte `json:"privateKey"`
	EntityID    string `json:"entityID"`
	SSOURL      string `json:"ssoURL"`
	SLOURL      string `json:"sloURL"`

	ServiceProviders map[string]struct {
		Metadata string `json:"metadata"`
	} `json:"serviceProviders"`
}

func (s *providerSpec) GetServiceProvider(r *http.Request, entityID string) (*saml.EntityDescriptor, error) {
	sp, ok := s.ServiceProviders[entityID]
	if !ok {
		return nil, os.ErrNotExist
	}

	return samlsp.ParseMetadata([]byte(sp.Metadata))
}

type sessionProvider struct {
	session saml.Session
}

func (p *sessionProvider) GetSession(w http.ResponseWriter, r *http.Request, req *saml.IdpAuthnRequest) *saml.Session {
	return &p.session
}

func sso(this js.Value, args []js.Value) any {
	var provider providerSpec

	if err := json.Unmarshal([]byte(args[0].String()), &provider); err != nil {
		return returnError(err)
	}

	entityID, _ := url.ParseRequestURI(provider.EntityID)
	ssoURL, _ := url.ParseRequestURI(provider.SSOURL)
	sloURL, _ := url.ParseRequestURI(provider.SLOURL)

	privateKey, err := x509.ParsePKCS8PrivateKey(provider.PrivateKey)
	if err != nil {
		return returnError(err)
	}

	cert, err := x509.ParseCertificate(provider.Certificate)
	if err != nil {
		return returnError(err)
	}

	idp := saml.IdentityProvider{
		Key:                     privateKey,
		Certificate:             cert,
		MetadataURL:             *entityID,
		SSOURL:                  *ssoURL,
		LogoutURL:               *sloURL,
		ServiceProviderProvider: &provider,
		SessionProvider:         nil,
	}

	reqURL, _ := url.ParseRequestURI(args[1].String())

	r := &http.Request{
		Method:     http.MethodGet,
		URL:        reqURL,
		Form:       reqURL.Query(),
		RequestURI: args[1].String(),
	}

	req, err := saml.NewIdpAuthnRequest(&idp, r)
	if err != nil {
		return returnError(err)
	}

	req.Now = saml.TimeNow()

	if err := req.Validate(); err != nil {
		return returnError(err)
	}

	cont := js.FuncOf(func(this js.Value, args []js.Value) any {
		var session saml.Session
		if err := json.Unmarshal([]byte(args[0].String()), &session); err != nil {
			return returnError(err)
		}

		idp.SessionProvider = &sessionProvider{
			session: session,
		}

		assertionMaker := saml.DefaultAssertionMaker{}

		if err := assertionMaker.MakeAssertion(req, &session); err != nil {
			return returnError(err)
		}

		err := req.MakeResponse()
		if err != nil {
			return returnError(err)
		}

		doc := etree.NewDocument()
		doc.SetRoot(req.ResponseEl)
		responseXML, err := doc.WriteToBytes()
		if err != nil {
			return err
		}

		responseJSON, err := json.Marshal(req.Assertion)
		if err != nil {
			return returnError(err)
		}

		form, err := req.PostBinding()
		if err != nil {
			return returnError(err)
		}

		return returnResult(map[string]interface{}{
			"URL":          form.URL,
			"SAMLResponse": form.SAMLResponse,
			"RelayState":   form.RelayState,
			"xml":          string(responseXML),
			"json":         string(responseJSON),
		})
	})

	reqJSON, err := json.Marshal(req.Request)
	if err != nil {
		return returnError(err)
	}

	return returnResult(map[string]interface{}{
		"request": string(reqJSON),
		"cont":    cont,
	})

	//session := idp.SessionProvider.GetSession(nil, r, req)
	//if session == nil {
	//	return returnResult(nil)
	//}

	//form, err := req.PostBinding()
	//if err != nil {
	//	return returnError(err)
	//}

	//return returnResult(map[string]interface{}{
	//	"SAMLResponse": form.SAMLResponse,
	//	"RelayState":   form.RelayState,
	//})
}
