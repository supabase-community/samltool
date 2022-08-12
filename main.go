package main

import (
	"encoding/json"
	"encoding/xml"
	"syscall/js"

	"github.com/hf/saml"
)

func main() {
	c := make(chan struct{})

	js.Global().Set("__samltool", library(c))

	<-c
}

func library(c chan struct{}) any {
	return map[string]interface{}{
		"parse": js.FuncOf(func(this js.Value, args []js.Value) any {
			var data any

			switch args[0].String() {
			case "request":
				var request saml.AuthnRequest

				if err := xml.Unmarshal([]byte(args[1].String()), &request); err != nil {
					return map[string]interface{}{
						"error": err.Error(),
					}
				}

				data = request

			case "assertion":
				var assertion saml.Assertion

				if err := xml.Unmarshal([]byte(args[1].String()), &assertion); err != nil {
					return map[string]interface{}{
						"error": err.Error(),
					}
				}

				data = assertion

			default:
				return nil
			}

			out, err := json.Marshal(&data)
			if err != nil {
				return map[string]interface{}{
					"error": err.Error(),
				}
			}

			return map[string]interface{}{
				"ok": string(out),
			}
		}),
	}
}
