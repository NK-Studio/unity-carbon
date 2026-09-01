# Unity API highlighting

Carbon uses the regular CodeMirror C# mode until the snippet contains enough Unity-specific
evidence. A known Unity namespace in a `using` statement, a Unity base class, or a Unity attribute
enables highlighting immediately. Otherwise, two distinct registered API identifiers are required.
Strings and comments do not count as evidence.

## Adding an API

Unity API data lives in `lib/unity-api/*.json`. Add a symbol to the file for its package, or copy an
existing file when adding a new package. New package files must also be imported and added to
`UNITY_API_MODULES` in `lib/unity-api/index.js`.

Every registry contains arrays with these categories:

- `namespaces`: complete namespaces such as `UnityEngine.InputSystem`
- `types`: classes; rendered as Islands Dark class purple (`#C191FF`)
- `interfaces`: interfaces such as `IEnumerator`; rendered as interface purple (`#B18CFA`)
- `structs`: struct types such as `Vector3`; rendered as value-type purple (`#D7BBFC`)
- `enums`: enum types such as `KeyCode`; rendered as value-type purple (`#D7BBFC`)
- `methods`: methods and Unity message callbacks; rendered as method mint (`#59C093`)
- `members`: properties, fields, and events; rendered as Islands Dark member cyan (`#66C3CC`)
- `attributes`: C# attributes without the optional `Attribute` suffix; rendered as type purple (`#C191FF`)
- `enumMembers`: enum values; rendered as cyan (`#6FB9C4`)

Rider paints interfaces (`#B18CFA`) and value types (`#D7BBFC`) apart from reference types (`#C191FF`),
while `enumMembers` are colored with `#6FB9C4`. An `interface`, `struct`, or `enum`
declared in the snippet itself gets its specific color too.

`System.Action` is rendered as a delegate (`#D7BBFC`). Events declared in the snippet are rendered
in event pink (`#DE90B7`) at both their declarations and usages, separately from ordinary members.

An enum value written through its type — `KeyCode.Space` — is highlighted from the qualifier
alone, so `enums` only needs the type name. `enumMembers` covers bare usages, which is why
values whose names are ordinary C# words (`None`, `Return`, `Delete`, the single letters) are
deliberately left out: listing them would repaint unrelated code.

Values are case-sensitive C# identifiers. Namespace values may contain dots; all other values must
be a single identifier. Do not add parentheses, generic parameters, declaring types, or qualified
member names.

Run the registry validator after every change:

```sh
yarn validate:unity-api
```

Add a Cypress case for at least one representative symbol when introducing a new package. Symbols
that exist in more than one category use this precedence: type/attribute, struct, enum, method,
enum member, then member.
