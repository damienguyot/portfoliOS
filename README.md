# portfoliOS

Portfolio interactif — une scène 3D rétro dans laquelle on navigue via un émulateur de terminal Linux affiché sur un écran CRT.

preview: damienguyot.fr

## Stack

- **Three.js** — scène 3D (pièce, bureau, écran CRT, clavier)
- **Canvas 2D** — rendu du terminal en temps réel, utilisé comme texture sur l'écran 3D
- **GLSL** — shader de distortion CRT (fisheye + pixelation)
- **Vanilla JS** — pas de build, pas de dépendances NPM

## Contenu

- Séquence de boot simulée (BIOS → kernel Linux → systemd → app portfolio)
- TUI avec 6 onglets : À propos, Technologies, Projets, Diplômes, Emplois, Contact
- Terminal interactif (help, whoami, neofetch, cowsay, reboot, etc.)
- Post-processing rétro : scanlines, distortion CRT, pixelation

## Hébergement

Site statique. Servir le dossier racine avec n'importe quel serveur HTTP :

```bash
python3 -m http.server 8000
```
