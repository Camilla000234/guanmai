# Female reference model

Kristen Browne; Heidi Schlehlein. 2023. *3D Reference Organ Set for Female, v1.5.* Human Reference Atlas / HuBMAP.

- Source: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- Official metadata: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/metadata.jsonld
- License: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/
- DOI as cited by the official metadata: https://doi.org/10.48539/HBM352.BTSQ.586 (DOI landing page returned 404 during retrieval; the CDN source and metadata were accessible).
- Original reference set is derived from Visible Human Female data provided by the National Library of Medicine.

Changes for this teaching viewer: flattened source transforms, translated feet to ground level, welded coincident vertices (1 micrometer tolerance), meshoptimizer simplification with 0.2% relative geometric error limit per structure, recomputed smooth normals, repacked as GLB, regrouped display materials. All 888 source meshes retained. Eight placenta/umbilical reference meshes are hidden by default and are not interpreted as a pregnancy state.

The reference set provides a body surface and selected organs. Muscles, skeleton and vascular coverage are partial. No wrist radial artery was found in the supplied source. Wrist teaching marks use approximate surface positions; they are not patient-specific measurements or clinically validated pulse locations. Male anatomy is not inserted into the female model. Different datasets should not be used to infer sex differences.

Display: Three.js r160, MIT (LICENSE-three). Geometry optimization: meshoptimizer v0.22, MIT (LICENSE-meshoptimizer).
