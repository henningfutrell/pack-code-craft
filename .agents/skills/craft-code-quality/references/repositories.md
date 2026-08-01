# Repositories

Repositories are **persistence ports**: interfaces owned by the domain or application
boundary, implemented by infrastructure adapters. Define a repository where an aggregate's
storage or query semantics warrant one. Do not require one for every entity.

Model the port in the aggregate's language and around the operation the use case needs:
load an aggregate by its identity, persist it atomically, or query the read shape the
application actually consumes. Keep it narrow. A repository is not a second database API.

Do not create `IRepository<T>` CRUD wrappers because "architecture" demands them. Generic
`Create`/`Read`/`Update`/`Delete` ceremony erases aggregate boundaries, duplicates the
ORM or driver, and supplies no meaningful seam. Use the database adapter directly where
there is no aggregate-level persistence contract to protect.

Keep concrete database connections, contexts, sessions, query builders, ORM entities, and
framework annotations in infrastructure adapters. Wire the adapter to the port in the
composition root. Enforce the boundary with layer rules and banned-symbol rules: the
architecture-test assets' `BannedSymbols.txt` comments show how to ban concrete external
symbols outside their adapter projects.

The domain never imports or names a persistence framework. It depends only on its own
models and persistence-port abstractions; infrastructure depends inward to implement them.
