package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/xml"
	"math/big"
	"net/url"
	"syscall/js"
	"time"

	"github.com/hf/saml"
)

func main() {
	c := make(chan struct{})

	js.Global().Set("__samltool", library(c))

	<-c
}

func library(c chan struct{}) any {
	return map[string]interface{}{
		"genprovider": js.FuncOf(genprovider),
		"parse":       js.FuncOf(parse),
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

	metadataXML, err := xml.MarshalIndent(metadata, "", "  ")
	if err != nil {
		return returnError(err)
	}

	return returnResult(map[string]interface{}{
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

func parse(this js.Value, args []js.Value) any {
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
