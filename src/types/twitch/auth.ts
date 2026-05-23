// Wire format matches Rust DcfAuthResponse — no camelCase rename, so the
// fields stay snake_case on the wire.
export type DcfAuthResponse = {
  user_code: string;
  verification_uri: string;
};
