export const INITIAL_PEDIDOS = [
  {
    id: 1001,
    usuarioId: 2,
    usuarioNombre: 'Abril Cliente',
    usuarioEmail: 'cliente@yokaihardware.com.ar',
    fecha: '2026-10-12T15:30:00.000Z',
    estado: 'ENTREGADO',
    total: 889499,
    metodoPago: 'Transferencia Bancaria (-10% OFF aplicado en promo)',
    direccionEnvio: 'Av. San Martín 850, San Rafael, Mendoza (CP 5600)',
    detalles: [
      {
        productoId: 2,
        nombre: 'AMD Ryzen 7 7800X3D 5.0GHz AM5',
        imagen:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBXDaLsJdOD1H0RELU4t3IWDVZyOpjHUd1usKMS5QOx7EgA447OWqgIg8JNsWkZBS-EYq5v7961TshM5q2lCHvwdE2_1JyucEddHOECXVUpVyNkjFYyksaBkr3RyY5Iew8tPKIvwaGeDRGX0bQjDiDz9dspfGyWRqYir6SAfU1Pga8N_21T6w1cY1HGRTfMOUbKourlYcWQS-Qtu9v2lkbR0HtX7Qc-Nfbs0xa5MiQg6-x7niyaVRHdow',
        cantidad: 1,
        precioUnitario: 699999,
      },
      {
        productoId: 3,
        nombre: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
        imagen:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBTmZ7clAzcydfkz0xXT1Uj84cfcFSoxUI3330MD1xyvx2cLE4yYGsYw56ZiSnPELBTrcMhTj6JTmL19Bt7Khb0yLiFKjSx9wBVB8YXMMAYvDIhxx6bsRHDlonHaXJ-zj4PS_KHEuPKt3LfA-wx4DGndbs7JugglSeQbK8YuSAWoGW7cibWvWH9H-Pbac6ddkoHVG7p707g_Jzqnup-NVtw24g_AGcTjsZOH6XZHa07FnDfENVasSTJww',
        cantidad: 1,
        precioUnitario: 189500,
      },
    ],
  },
  {
    id: 1002,
    usuarioId: 2,
    usuarioNombre: 'Abril Cliente',
    usuarioEmail: 'cliente@yokaihardware.com.ar',
    fecha: '2026-10-15T18:10:00.000Z',
    estado: 'ENVIADO',
    total: 504000,
    metodoPago: 'Tarjeta de Crédito (6 cuotas fijas)',
    direccionEnvio: 'Av. San Martín 850, San Rafael, Mendoza (CP 5600)',
    detalles: [
      {
        productoId: 7,
        nombre: 'Fuente Seasonic Focus GX-850 850W 80 Plus Gold Modular',
        imagen:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuB71CgfOOXBUhhQ6vyIvKb562cmLK5RRVNYpFcDl1IAJA15tnT-y-4cMdsySH32qhWaRvBQ4H6D-2k3PZY8j6hxLhnX3zVrEqdJVmaewksrwLIPklwf2Ei0GPl26VzHbRzJ-xVyPb1t88yNKgDkBRxr31E3dZ4HGM4fkyfm2IXQR_aVnS0yh2Ocr2ff-SQFE_T4M5HaD-pJAw0yd0TSLuteyeT8ZWbSKlO3YRxTuZdre9GGbn1hVqICxw',
        cantidad: 1,
        precioUnitario: 215000,
      },
      {
        productoId: 8,
        nombre: 'Gabinete Lian Li O11 Vision Chrome Panoramic Glass',
        imagen:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAKGYKX1sIWQX2cRDeU0aWpme61J_DIsCLShEEA2RReyX_Y6RpJhPtrk6ApYBS1YnfbuOaapzHHJj4icbDF_vabf6Z8J56Wvmy6kiRGzDItgWWwBkhNFd5Jcy4yVdevlwHBhsCmz6HEfCVudju4qOjsOrpHb1VpeoP9AatuBA80Oqkb_ybq-2vrNO7Tk6TG3vbdHXaFETpyFDoQJ1l0sn_nH6nf-j-u82BvIvt8lUkJRDnTBps540OynQ',
        cantidad: 1,
        precioUnitario: 289000,
      },
    ],
  },
];
