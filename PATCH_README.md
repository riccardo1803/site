# Research Mode LaTeX — v1.27.9

Apply to repository currently at v1.27.8 by copying the files in this ZIP to the repository root, preserving paths.

The Research Mode example on interactive-papers.html now contains editable TeX source ($...$ and \[...\]) rather than pre-generated mathematical SVG markup.
A local copy of MathJax renders inline and display mathematics. It is restricted to the preview: the Simple Mode and the interactive paper itself remain unchanged.

Modified files:
- interactive-papers.html (compiled public page)
- src/pages/interactive-papers.html (authoritative editable source)
- assets/research-preview-tex.js (typesets only the Research Mode example)
- assets/vendor/mathjax/tex-svg.js (locally hosted MathJax)
- assets/vendor/mathjax/LICENSE.txt (MathJax license)

Verification: 306 static checks passed. Chromium offline tests passed on light desktop and dark mobile, including two inline TeX expressions, two displayed binomial expressions, no MathJax error nodes, unchanged Simple Mode graph, and no horizontal overflow.

Keep all five files together; the standalone article is not altered.
