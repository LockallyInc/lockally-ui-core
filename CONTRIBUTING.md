# Contributing

Yes, please. Issues and pull requests on this repository are read and answered.

Unlike Lockally's core SDKs, nothing here is generated: this package is hand-written on top of the Lockally HTTP API. So a
patch is an ordinary patch. We carry it into the source tree this repository is
published from, and it ships from then on.

If the bug turns out to be in the underlying API rather than in this package,
say so in the issue and we will fix it there instead.

## What happens to a merged pull request

Releases are cut by syncing this repository from Lockally's source tree. That
sync stops when it finds a commit here it did not write, so a merged pull
request holds the next release until somebody has carried it across. It is not
silently overwritten.

## Security

Do not open a public issue for a vulnerability. Mail <security@lockally.com>;
see <https://lockally.com/.well-known/security.txt>.
