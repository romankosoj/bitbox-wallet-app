package relay

import "github.com/shiftdevices/godbb/util/errp"

// Data models the content of a successful response.
type Data struct {
	// ID is the value of the auto-incrementing row ID column of the relay server.
	ID int `json:"id"`

	// Age describes how many seconds passed between a message was pushed and fetched.
	Age int `json:"age"`

	// Payload is the encrypted message which is passed from the mobile to the desktop.
	Payload string `json:"payload"`
}

// Response models a response from the relay server.
type Response struct {
	// Status is either "ok" or "nok".
	Status string `json:"status"`

	// Data only exists if status is "ok" (and can even then be nil).
	Data []Data `json:"data,omitempty"`

	// Error only exists if status is "nok" (and then not nil).
	Error *string `json:"error,omitempty"`
}

// GetErrorIfNok returns an error if the status of the response is 'nok'.
func (response *Response) GetErrorIfNok() error {
	if response.Status == "nok" {
		if response.Error != nil {
			return errp.New(*response.Error)
		}
		return errp.New("Received a 'nok' response from the relay server without an error message.")
	}
	return nil
}
