// Verified against NetArchTest.Rules 1.3.2.
//
// NetArchTest has NO baseline/freeze mechanism — unlike ArchUnit's FreezingArchRule
// (see kotlin-archunit/), there is no way to snapshot today's violations and gate only on
// new ones. If this assembly already has violations, use the ratchet's diff-scoping
// instead (see craft-code-quality/references/ratchet.md): run this suite but treat
// failures in already-known files as informational until they are cleared by hand, or
// scope which namespaces/assemblies are analyzed to newly-written code first. Do not
// expect NetArchTest itself to freeze anything.

using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using NetArchTest.Rules;
using Xunit;

namespace Example.App.ArchitectureTests
{
    public class ArchitectureTests
    {
        // Replace "Example.App" with the real assembly name (or, for a compile-time
        // checked reference, typeof(SomeKnownType).Assembly where SomeKnownType is any
        // public type in the assembly under test).
        private static readonly Assembly AppAssembly = Assembly.Load("Example.App");

        // Domain/core must not depend on framework, transport, or persistence code.
        [Fact]
        public void Domain_Should_Not_DependOn_Infrastructure()
        {
            var result = Types.InAssembly(AppAssembly)
                .That().ResideInNamespace("Example.App.Domain")
                .ShouldNot().HaveDependencyOn("Example.App.Infrastructure")
                .GetResult();

            Assert.True(result.IsSuccessful);
        }

        // UI segregated from the core API boundary: the domain namespace must not
        // depend on the UI namespace either.
        [Fact]
        public void Domain_Should_Not_DependOn_UI()
        {
            var result = Types.InAssembly(AppAssembly)
                .That().ResideInNamespace("Example.App.Domain")
                .ShouldNot().HaveDependencyOn("Example.App.UI")
                .GetResult();

            Assert.True(result.IsSuccessful);
        }

        // Test-boundary rule, same mechanism as the Kotlin/ArchUnit template: this is an
        // import-boundary check on namespaces, not a semantic "did you mock a domain
        // type" check. A determined author can still reach a mocking library indirectly
        // through a shared test-support namespace that itself is not under
        // Example.App.Domain.Tests.
        [Fact]
        public void DomainTests_Should_Not_DependOn_MockingLibrary()
        {
            var result = Types.InAssembly(AppAssembly)
                .That().ResideInNamespace("Example.App.Domain.Tests")
                .ShouldNot().HaveDependencyOn("Moq")
                .GetResult();

            Assert.True(result.IsSuccessful);
        }

        // No first-party or well-known community Roslyn analyzer bans
        // [assembly: InternalsVisibleTo(...)] (checked Meziantou.Analyzer,
        // StyleCop.Analyzers, Roslynator, SonarAnalyzer.CSharp). NetArchTest itself has no
        // assembly-attribute predicate either. The two remaining options are a custom
        // Roslyn analyzer, or this: a plain-reflection assertion over the assembly's
        // custom attributes, run as part of this same arch-test suite.
        [Fact]
        public void Assembly_Should_Not_Grant_InternalsVisibleTo()
        {
            var grants = AppAssembly
                .GetCustomAttributes<InternalsVisibleToAttribute>()
                .Select(a => a.AssemblyName)
                .ToList();

            Assert.True(
                grants.Count == 0,
                $"InternalsVisibleTo grants found, test-only visibility escapes: {string.Join(", ", grants)}");

            // If a real, reviewed exception exists (e.g. a dedicated test-support
            // assembly), replace Assert.True(grants.Count == 0, ...) above with an
            // assertion against an explicit allowlist of assembly names instead of
            // banning the attribute outright.
        }
    }
}

/*
 * BannedSymbols.txt (sibling file) is wired via Microsoft.CodeAnalysis.BannedApiAnalyzers
 * 5.6.0, not NetArchTest — it bans concrete symbol references (a type, a constructor, a
 * method) project-wide or per-project, which is a different mechanism from NetArchTest's
 * namespace-dependency rules above. Wire it in the .csproj of any project the ban should
 * apply to:
 *
 *   <ItemGroup>
 *     <PackageReference Include="Microsoft.CodeAnalysis.BannedApiAnalyzers" Version="5.6.0" PrivateAssets="all" />
 *     <AdditionalFiles Include="BannedSymbols.txt" />
 *   </ItemGroup>
 *
 * Diagnostics it reports: RS0030 (banned API used), RS0031 (duplicate ban entry in the
 * file), RS0035 (restricted-InternalsVisibleTo violation — a narrower mechanism than an
 * outright ban: it restricts which assemblies may be granted internals access, it does
 * not forbid the attribute from being used at all. UNVERIFIED: its exact configuration
 * shape — check current BannedApiAnalyzers docs before wiring it. This is why the
 * reflection test above exists as the actual outright-ban mechanism).
 *
 * .editorconfig can scope severity per directory, and a nested .editorconfig closer to
 * the file wins over one further up the tree:
 *
 *   [src/Domain/**\/*.cs]
 *   dotnet_diagnostic.RS0030.severity = error
 *
 *   # src/Domain/Generated/.editorconfig, closer to the file, overrides the section above
 *   [*.cs]
 *   dotnet_diagnostic.RS0030.severity = none
 */
