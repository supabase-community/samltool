# SAML Tool by Supabase

Built during [#SupaLaunchWeek 5](https://launchweek.dev).

## Why

We're adding SAML support to [Supabase Auth](https://supabase.com/auth)
and this is a tool the world can use to test their SAML setup. It uses the
[same library](https://github.com/crewjam/saml) we're going to be using inside
GoTrue.

## How

SAML is really mostly a browser-based technology, so unlike other existing test
tools this one will try to be a Single-Page App as much as possible. This has
many benefits:

- Cheap to host
- Private keys don't leave your environment
- Create as many mock Identity Providers as you want without worrying that
  someone can enter your app

Since `crewjam/saml` is written in Go, we'll be using Go's WebAssembly support.

## Is it done yet?

No.
