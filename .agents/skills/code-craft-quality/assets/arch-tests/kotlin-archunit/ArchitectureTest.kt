package com.example.app.architecture

// Verified against archunit-junit5 1.4.2. Adapt the placeholder root package
// ("com.example.app") and the placeholder layer sub-packages (domain/infrastructure/
// controller) to the real ones before wiring this in. ArchUnit analyzes compiled
// bytecode on the classpath given to @AnalyzeClasses, not source text.

// NOTE: the artifact is `archunit-junit5`, but the Java package has no `junit5` segment —
// it is `com.tngtech.archunit.junit`. Verified against ArchUnit source at tag v1.4.1.
import com.tngtech.archunit.junit.AnalyzeClasses
import com.tngtech.archunit.junit.ArchTest
import com.tngtech.archunit.lang.ArchRule
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses
import com.tngtech.archunit.library.Architectures.layeredArchitecture
import com.tngtech.archunit.library.freeze.FreezingArchRule

@AnalyzeClasses(packages = ["com.example.app"])
class ArchitectureTest {

    companion object {

        // @JvmField on every rule below is REQUIRED, not stylistic. ArchUnit's @ArchTest
        // contract is "a static field of type ArchRule". A plain Kotlin `val` in a
        // companion object compiles to an instance field on the Companion singleton, which
        // reflection over this class will not see. @JvmStatic does not fix it either — it
        // only adds forwarding accessors, leaving the backing field where it was.
        // @JvmField is what actually relocates the field to be static on the enclosing
        // class. (Reasoned from Kotlin/JVM semantics plus ArchTest's javadoc contract; the
        // ArchUnit user guide has no Kotlin section, so confirm empirically the first time
        // — if a rule is silently never evaluated, this is why. Per the canary rule, prove
        // each rule fails on a deliberate violation before trusting it.)
        //
        // Scope: @AnalyzeClasses includes test classes by default. Inclusion is decided by
        // compiled-output location, not package name, so DoNotIncludeTests / OnlyIncludeTests
        // in `importOptions` are how you restrict to main-only or test-only.

        // Domain/core must not depend on framework, transport, UI, or persistence code.
        // This is the load-bearing hexagonal rule: dependency direction points inward,
        // and everything else in this file is a variant of it.
        //
        // FreezingArchRule.freeze(rule) wraps the rule so its first run against a fresh
        // store always passes and records whatever violations exist right now as the
        // frozen baseline (see archunit.properties for where the store lives). Every run
        // after that fails ONLY on violations not already in the baseline — existing,
        // un-fixed violations stay quiet. When a violation disappears because the
        // offending code was fixed, it is pruned from the baseline automatically on the
        // next passing run (freeze.store.default.allowStoreUpdate=true, the default) —
        // the baseline self-shrinks; it never has to be hand-edited down.
        @ArchTest
        @JvmField
        val domainDoesNotDependOnInfrastructure: ArchRule = FreezingArchRule.freeze(
            noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAPackage("..infrastructure..")
                .because("the domain/core must not depend on framework, transport, or persistence code")
        )

        // UI segregated from the core API boundary, expressed as a layered-architecture
        // rule rather than a single pairwise dependency check. mayNotBeAccessedByAnyLayer()
        // on the Controller layer pins it at the edge: nothing in the system may depend on
        // it, so it structurally cannot become a dependency of the domain.
        @ArchTest
        @JvmField
        val layering: ArchRule = FreezingArchRule.freeze(
            layeredArchitecture()
                .consideringAllDependencies()
                .layer("Controller").definedBy("..controller..")
                .layer("Domain").definedBy("..domain..")
                .layer("Infrastructure").definedBy("..infrastructure..")
                .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
                .whereLayer("Domain").mayOnlyBeAccessedByLayers("Controller", "Infrastructure")
        )

        // Test-boundary rule: forbid the mocking library from anything under ..domain..
        //
        // As written this covers BOTH production and test domain classes, because test
        // classes are in scope by default (see the note above). That is deliberate and
        // stronger than the stated rule — production domain code has no business
        // referencing a mocking library either. To target test classes only, add
        // OnlyIncludeTests to importOptions on a separate test class.
        //
        // This is an IMPORT-BOUNDARY rule, not a semantic "did you mock a domain class"
        // check. ArchUnit records a dependency edge from a domain test class to
        // org.mockito.* whenever that class references Mockito by name in its bytecode.
        // Mockito.mock(DomainClass.class) creates such a reference as a side effect of
        // being called at all — so this rule catches it, but as inference from ArchUnit's
        // documented bytecode-scanning mechanics, not because ArchUnit or Mockito publish
        // this as an intended pattern. Verify it against your Mockito version before
        // treating it as the only guard. A determined author can still reach Mockito
        // indirectly (e.g. through a shared test-support helper that itself lives outside
        // ..domain..) without tripping this rule.
        @ArchTest
        @JvmField
        val domainTestsDoNotDependOnMockito: ArchRule = FreezingArchRule.freeze(
            noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAPackage("org.mockito..")
                .because("domain tests must exercise real domain logic, not mock it")
        )
    }
}
