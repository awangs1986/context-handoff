# Historical standalone repository

Maintenance moved to [context-handoff in pi-coffee](https://github.com/awangs1986/pi-coffee/tree/main/packages/context-handoff).
GitHub [awangs1986/pi-coffee](https://github.com/awangs1986/pi-coffee) and
[Gitea awangs/pi-coffee](http://gitea:3000/awangs/pi-coffee) now share the same
plugin source tree. Read the [repository map](https://github.com/awangs1986/pi-coffee/blob/main/REPOSITORIES.md)
and [release guide](https://github.com/awangs1986/pi-coffee/blob/main/docs/releases/README.md).

This repository retains its history, branches, tags and releases for provenance and
rollback. Its main history was imported into the unified repository with normal Git
ancestry. Do not implement fixes or publish new plugin versions here. New releases
use independent plugin versions and namespaced tags in pi-coffee. Existing pinned
commits remain available; migration does not change native session data or deploy a Host.
