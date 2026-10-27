# Website v1.27.10 — Research Mode typography and cleaner Formalism

Apply to version v1.27.9. Copy the three public files from GitHub_PATCH.zip into the repository root, preserving the `assets/styles/` subdirectory.

Changes:
- Research Mode preview uses Latin Modern Roman (LaTeX-style) as its default prose font. The actual RGG research article already has this font stack, and remains unchanged. Simple Mode is unchanged.
- The Formalism retains its white paper card but removes the decorative ochre mathematical inset.
- The definition of clique has one centred TeX display. The four-vertex example, `$\binom{4}{2}=6$`, now appears inline in the explanation.
- Dead MathML/ochre inset CSS removed from maintained sources.

MathJax test: 4 SVG math elements, 1 display equation, 1 inline equation in final sentence, 0 errors, no horizontal overflow in 1440px light and 390px dark offline Chromium. Website checks 306/306.

Editable project sources for subsequent changes are in the Source_PATCH.zip or Workspace.zip. The source of truth for the page is `src/pages/interactive-papers.html`.
