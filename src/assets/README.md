# Carpeta de Assets

Puedes colocar aquí tus recursos estáticos optimizados por Astro:
- Imágenes (`.png`, `.jpg`, `.webp`, `.svg`)
- Iconos y logos

## Uso en componentes Astro:
```astro
---
import { Image } from 'astro:assets';
import miLogo from '../assets/logo.png';
---

<Image src={miLogo} alt="Logo Oficial" />
```
