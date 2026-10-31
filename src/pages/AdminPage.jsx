import React, { useState, useEffect, useCallback } from 'react';
import { getProductos } from '../api/productos';
import { getCategorias } from '../api/categorias';
import { getMarcas } from '../api/marcas';
import {
  getProductosStockBajoAdmin,
  createProducto,
  updateProducto,
  deleteProducto,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getAllPedidosAdmin,
  updateEstadoPedido,
} from '../api/admin';
import { formatARS, formatDateAR } from '../utils/formatters';
import { TRANSICIONES_ESTADO_PEDIDO, ESTADO_PEDIDO_LABEL } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';

const SIDEBAR_SECTIONS = [
  { id: 'productos', label: 'Productos', icon: 'inventory_2', kanji: '品' },
  { id: 'categorias', label: 'Categorías', icon: 'category', kanji: '類' },
  { id: 'stock', label: 'Control de Stock', icon: 'warehouse', kanji: '庫' },
  { id: 'pedidos', label: 'Pedidos', icon: 'local_shipping', kanji: '注' },
];

const EMPTY_PRODUCT_FORM = {
  sku: '',
  nombre: '',
  categoria: 'Oni',
  marca: 'ASUS',
  precio: '',
  stock: '',
  stockMinimo: '3',
  imagen: '',
  subtituloCorto: '',
  descripcion: '',
  especificacionesTexto: 'Garantía: Oficial 12 meses\nOrigen: Importador Oficial Argentina',
};

const EMPTY_CATEGORY_FORM = {
  nombre: '',
  subtitulo: '',
  kanji: '霊',
  icono: 'memory',
  acento: 'gold',
  descripcion: '',
};

export default function AdminPage() {
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState('productos');
  const [productos, setProductos] = useState([]);
  const [stockBajoList, setStockBajoList] = useState([]);
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchAdmin, setSearchAdmin] = useState('');

  // Estado Modal Producto
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);

  // Estado Modal Categoría
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);

  // Estado de edición rápida de stock
  const [stockDrafts, setStockDrafts] = useState({});

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsRes, stockBajoRes, catsRes, marcasRes, pedsRes] = await Promise.all([
        getProductos({ page: 0, size: 100 }),
        getProductosStockBajoAdmin(),
        getCategorias(),
        getMarcas(),
        getAllPedidosAdmin(),
      ]);
      const prodList = prodsRes.content || [];
      setProductos(prodList);
      setStockBajoList(Array.isArray(stockBajoRes) ? stockBajoRes : []);
      setCategorias(catsRes || []);
      setMarcas(marcasRes || []);
      setPedidos(pedsRes || []);

      const drafts = {};
      prodList.forEach((p) => {
        drafts[p.id] = p.stock;
      });
      setStockDrafts(drafts);
    } catch (err) {
      setError(
        err?.message || 'Error al cargar los datos del panel de administración.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // --- Acciones ABM Productos ---
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      categoria: categorias[0]?.nombre || 'Oni',
      marca: marcas[0]?.nombre || 'ASUS',
    });
    setProductModalOpen(true);
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    const specsLines = Object.entries(prod.especificaciones || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    setProductForm({
      sku: prod.sku || '',
      nombre: prod.nombre || '',
      categoria: prod.categoria || 'Oni',
      marca: prod.marca || 'ASUS',
      precio: prod.precio ?? '',
      stock: prod.stock ?? '',
      stockMinimo: prod.stockMinimo ?? 3,
      imagen: prod.imagen || '',
      subtituloCorto: prod.subtituloCorto || '',
      descripcion: prod.descripcion || '',
      especificacionesTexto: specsLines,
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.nombre.trim() || Number(productForm.precio) <= 0) {
      showToast('Completá un nombre y un precio mayor a $0.', 'warning');
      return;
    }

    const parsedSpecs = {};
    String(productForm.especificacionesTexto || '')
      .split('\n')
      .forEach((line) => {
        const idx = line.indexOf(':');
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          if (key && val) parsedSpecs[key] = val;
        }
      });

    const payload = {
      sku: productForm.sku.trim() || undefined,
      nombre: productForm.nombre.trim(),
      categoria: productForm.categoria,
      marca: productForm.marca,
      precio: Number(productForm.precio),
      stock: Math.max(0, Number(productForm.stock) || 0),
      stockMinimo: Math.max(0, Number(productForm.stockMinimo ?? 3)),
      imagen: productForm.imagen.trim(),
      subtituloCorto: productForm.subtituloCorto.trim(),
      descripcion: productForm.descripcion.trim(),
      especificaciones: parsedSpecs,
    };

    try {
      if (editingProduct) {
        await updateProducto(editingProduct.id, payload);
        showToast(`Producto "${payload.nombre}" actualizado.`, 'success');
      } else {
        await createProducto(payload);
        showToast(`Producto "${payload.nombre}" creado con éxito.`, 'success');
      }
      setProductModalOpen(false);
      await loadAdminData();
    } catch (err) {
      showToast(err?.message || 'Error al guardar el producto.', 'error');
    }
  };

  const handleDeleteProduct = async (prod) => {
    try {
      await deleteProducto(prod.id);
      showToast(`Producto "${prod.nombre}" eliminado.`, 'warning');
      await loadAdminData();
    } catch (err) {
      showToast(err?.message || 'No se pudo eliminar el producto.', 'error');
    }
  };

  // --- Acciones ABM Categorías ---
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      nombre: cat.nombre || '',
      subtitulo: cat.subtitulo || '',
      kanji: cat.kanji || '霊',
      icono: cat.icono || 'memory',
      acento: cat.acento || 'gold',
      descripcion: cat.descripcion || '',
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.nombre.trim() || !categoryForm.subtitulo.trim()) {
      showToast('Completá el nombre Yokai y el subtítulo del rubro.', 'warning');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoria(editingCategory.id, categoryForm);
        showToast(`Categoría "${categoryForm.nombre}" actualizada.`, 'success');
      } else {
        await createCategoria(categoryForm);
        showToast(`Categoría "${categoryForm.nombre}" creada.`, 'success');
      }
      setCategoryModalOpen(false);
      await loadAdminData();
    } catch (err) {
      showToast(err?.message || 'Error al guardar la categoría.', 'error');
    }
  };

  const handleDeleteCategory = async (cat) => {
    try {
      await deleteCategoria(cat.id);
      showToast(`Categoría "${cat.nombre}" eliminada.`, 'warning');
      await loadAdminData();
    } catch (err) {
      showToast(err?.message || 'No se pudo eliminar la categoría.', 'error');
    }
  };

  // --- Acciones Control de Stock ---
  const handleSaveStock = async (prod, nuevoStock) => {
    const cleanStock = Math.max(0, Number(nuevoStock) || 0);
    try {
      await updateProducto(prod.id, { stock: cleanStock });
      showToast(
        `Stock de "${prod.nombre}" actualizado a ${cleanStock} u.`,
        'success'
      );
      await loadAdminData();
    } catch (err) {
      showToast(err?.message || 'Error al actualizar el stock.', 'error');
    }
  };

  // --- Acciones Estado de Pedidos ---
  const handleStatusChange = async (pedidoId, nuevoEstado) => {
    try {
      const updated = await updateEstadoPedido(pedidoId, nuevoEstado);
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedidoId ? { ...p, estado: updated?.estado || nuevoEstado } : p
        )
      );
      showToast(
        `Estado del pedido #${pedidoId} actualizado a ${
          ESTADO_PEDIDO_LABEL[nuevoEstado] || nuevoEstado
        }.`,
        'success'
      );
      await loadAdminData();
    } catch (err) {
      showToast(
        err?.message || 'Error al cambiar el estado del pedido.',
        'error'
      );
    }
  };

  const filteredProducts = productos.filter((p) => {
    if (!searchAdmin.trim()) return true;
    const q = searchAdmin.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      String(p.marca).toLowerCase().includes(q) ||
      String(p.categoria).toLowerCase().includes(q) ||
      String(p.sku || '').toLowerCase().includes(q)
    );
  });

  const stockSectionItems = soloStockBajo ? stockBajoList : productos;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
      {/* Encabezado Admin */}
      <div className="mb-space-lg pb-space-md border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-vermilion" />
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
              Santuario Central • Rol ADMIN
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright mt-1">
            Panel de Administración Yokai
          </h1>
          <p className="font-body-md text-body-md text-outline">
            Gestión integral de catálogo, categorías espirituales, inventario y órdenes de compra.
          </p>
        </div>

        {/* KPIs rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="px-3.5 py-2 rounded bg-surface-container-low border border-outline-variant/50">
            <span className="font-label-sm text-outline uppercase block">
              Productos
            </span>
            <span className="font-headline-sm text-primary font-bold">
              {productos.length}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded bg-surface-container-low border border-outline-variant/50">
            <span className="font-label-sm text-outline uppercase block">
              Categorías
            </span>
            <span className="font-headline-sm text-on-surface-bright font-bold">
              {categorias.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSection('stock');
              setSoloStockBajo(true);
            }}
            className="text-left px-3.5 py-2 rounded bg-surface-container-low hover:bg-secondary-container/20 border border-vermilion/40 transition-colors"
          >
            <span className="font-label-sm text-secondary uppercase block">
              Alerta Stock Mín.
            </span>
            <span className="font-headline-sm text-secondary font-bold">
              {stockBajoList.length}
            </span>
          </button>
          <div className="px-3.5 py-2 rounded bg-surface-container-low border border-outline-variant/50">
            <span className="font-label-sm text-outline uppercase block">
              Pedidos
            </span>
            <span className="font-headline-sm text-tertiary font-bold">
              {pedidos.length}
            </span>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadAdminData} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Sidebar de Navegación Admin */}
        <aside className="lg:col-span-3 rounded bg-surface-container-low border border-outline-variant/60 p-space-md flex flex-col gap-2 shadow-lg">
          <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest px-2 pb-1">
            Módulos de Gestión
          </span>
          {SIDEBAR_SECTIONS.map((sec) => {
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`w-full px-3.5 py-3 rounded flex items-center justify-between transition-all ${
                  active
                    ? 'bg-primary-container text-on-primary font-bold shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface-bright'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px]">
                    {sec.icon}
                  </span>
                  <span className="font-label-lg text-label-lg">{sec.label}</span>
                </div>
                <span className="font-serif text-sm opacity-75">{sec.kanji}</span>
              </button>
            );
          })}
        </aside>

        {/* Área de Contenido Admin */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="rounded bg-surface-container-low border border-outline-variant/50 p-space-xl animate-pulse h-96" />
          ) : (
            <>
              {/* 1. SECCIÓN PRODUCTOS (ABM) */}
              {activeSection === 'productos' && (
                <div className="rounded bg-surface-container-low border border-outline-variant/60 p-space-lg flex flex-col gap-space-md shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant/40">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface-bright">
                        ABM de Productos ({filteredProducts.length})
                      </h2>
                      <p className="font-body-sm text-outline">
                        Alta, edición y baja de componentes del catálogo.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={searchAdmin}
                        onChange={(e) => setSearchAdmin(e.target.value)}
                        placeholder="Filtrar por nombre, SKU o marca..."
                        className="bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
                      />
                      <button
                        type="button"
                        onClick={openCreateProduct}
                        className="px-4 py-2 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-md uppercase tracking-wider flex items-center gap-1.5 border border-secondary/30 shadow-vermilion-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          add
                        </span>
                        <span>Nuevo Producto</span>
                      </button>
                    </div>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <EmptyState
                      kanji="無"
                      icon="inventory_2"
                      title="No se encontraron productos"
                      description="No hay productos que coincidan con el filtro actual."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant/50 font-label-sm text-label-sm text-outline uppercase tracking-wider">
                            <th className="py-3 px-2">SKU / ID</th>
                            <th className="py-3 px-2">Componente</th>
                            <th className="py-3 px-2">Categoría</th>
                            <th className="py-3 px-2">Marca</th>
                            <th className="py-3 px-2">Precio ARS</th>
                            <th className="py-3 px-2">Estado / Stock</th>
                            <th className="py-3 px-2 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30 font-body-sm">
                          {filteredProducts.map((prod) => {
                            const sinStock =
                              prod.estadoStock === 'Sin stock' || prod.stock <= 0;
                            const ultimas = prod.estadoStock === 'Últimas unidades';
                            return (
                              <tr
                                key={prod.id}
                                className="hover:bg-surface-container/60 transition-colors"
                              >
                                <td className="py-3 px-2 text-outline font-mono text-xs">
                                  <div>{prod.sku || `#${prod.id}`}</div>
                                  <span className="text-[11px] opacity-70">
                                    ID #{prod.id}
                                  </span>
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={prod.imagen}
                                      alt={prod.nombre}
                                      className="w-10 h-10 object-contain rounded bg-surface-container-lowest p-1 shrink-0"
                                    />
                                    <span className="text-on-surface-bright font-medium line-clamp-1 max-w-xs">
                                      {prod.nombre}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-2">
                                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm uppercase">
                                    {prod.categoria}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-on-surface-variant">
                                  {prod.marca}
                                </td>
                                <td className="py-3 px-2 font-semibold text-on-surface-bright">
                                  {formatARS(prod.precio)}
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex flex-col">
                                    <span
                                      className={`font-semibold ${
                                        sinStock
                                          ? 'text-error'
                                          : ultimas
                                          ? 'text-secondary'
                                          : 'text-tertiary'
                                      }`}
                                    >
                                      {prod.estadoStock || 'En stock'} ({prod.stock} u.)
                                    </span>
                                    <span className="font-label-sm text-outline">
                                      Mín: {prod.stockMinimo ?? 3} u.
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openEditProduct(prod)}
                                      className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary font-label-sm uppercase transition-colors"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProduct(prod)}
                                      className="px-2.5 py-1 rounded bg-secondary-container/40 hover:bg-vermilion text-secondary hover:text-white font-label-sm uppercase transition-colors"
                                    >
                                      Borrar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 2. SECCIÓN CATEGORÍAS (ABM) */}
              {activeSection === 'categorias' && (
                <div className="rounded bg-surface-container-low border border-outline-variant/60 p-space-lg flex flex-col gap-space-md shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant/40">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface-bright">
                        ABM de Categorías Yokai ({categorias.length})
                      </h2>
                      <p className="font-body-sm text-outline">
                        Administrá las categorías espirituales y sus insignias Kanji.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openCreateCategory}
                      className="px-4 py-2 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-md uppercase tracking-wider flex items-center gap-1.5 border border-secondary/30 shadow-vermilion-sm self-start sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                      <span>Nueva Categoría</span>
                    </button>
                  </div>

                  {categorias.length === 0 ? (
                    <EmptyState
                      kanji="類"
                      icon="category"
                      title="No hay categorías registradas"
                      description="Creá la primera categoría espiritual para organizar los productos."
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                      {categorias.map((cat) => (
                        <div
                          key={cat.id}
                          className="p-space-md rounded bg-surface-container border border-outline-variant/50 flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded bg-surface-container-lowest border border-primary-container/40 flex items-center justify-center font-serif text-2xl text-primary shrink-0">
                              {cat.kanji}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-label-sm text-primary uppercase tracking-widest">
                                  {cat.nombre}
                                </span>
                                <span className="text-outline-variant">•</span>
                                <span className="font-headline-sm text-[16px] text-on-surface-bright">
                                  {cat.subtitulo}
                                </span>
                              </div>
                              <p className="font-body-sm text-outline mt-1">
                                {cat.descripcion}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditCategory(cat)}
                              className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary font-label-sm uppercase transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="px-2.5 py-1 rounded bg-secondary-container/40 hover:bg-vermilion text-secondary hover:text-white font-label-sm uppercase transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. SECCIÓN STOCK (Edición Rápida y Alertas de Stock Mínimo) */}
              {activeSection === 'stock' && (
                <div className="rounded bg-surface-container-low border border-outline-variant/60 p-space-lg flex flex-col gap-space-md shadow-xl">
                  <div className="pb-space-sm border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface-bright">
                        Control de Stock y Alertas de Stock Mínimo
                      </h2>
                      <p className="font-body-sm text-outline">
                        Modificá las unidades disponibles. El servidor alerta automáticamente cuando stock ≤ stockMinimo.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSoloStockBajo(false)}
                        className={`px-3 py-1.5 rounded font-label-sm uppercase tracking-wider border ${
                          !soloStockBajo
                            ? 'bg-primary-container text-on-primary border-primary font-bold'
                            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60'
                        }`}
                      >
                        Todos ({productos.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSoloStockBajo(true)}
                        className={`px-3 py-1.5 rounded font-label-sm uppercase tracking-wider border ${
                          soloStockBajo
                            ? 'bg-vermilion text-white border-secondary font-bold'
                            : 'bg-surface-container-lowest text-secondary border-vermilion/50'
                        }`}
                      >
                        En Alerta ({stockBajoList.length})
                      </button>
                    </div>
                  </div>

                  {stockBajoList.length > 0 && (
                    <div className="p-3.5 rounded bg-secondary-container/25 border border-vermilion/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-secondary font-body-sm">
                        <span className="material-symbols-outlined text-[20px]">
                          warning
                        </span>
                        <span>
                          Hay <strong>{stockBajoList.length}</strong> producto(s) en nivel de stock mínimo o agotado según el servidor.
                        </span>
                      </div>
                    </div>
                  )}

                  {stockSectionItems.length === 0 ? (
                    <EmptyState
                      kanji="庫"
                      icon="check_circle"
                      title="Sin alertas de stock mínimo"
                      description="Todos los componentes superan actualmente su umbral de stock mínimo."
                    />
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {stockSectionItems.map((prod) => {
                        const currentDraft =
                          stockDrafts[prod.id] !== undefined
                            ? stockDrafts[prod.id]
                            : prod.stock;
                        const isAlert =
                          prod.estadoStock === 'Sin stock' ||
                          prod.estadoStock === 'Últimas unidades' ||
                          Number(prod.stock) <= Number(prod.stockMinimo ?? 3);

                        return (
                          <div
                            key={prod.id}
                            className={`p-3.5 rounded bg-surface-container border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isAlert
                                ? 'border-vermilion/60'
                                : 'border-outline-variant/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.imagen}
                                alt={prod.nombre}
                                className="w-11 h-11 object-contain rounded bg-surface-container-lowest p-1 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-label-sm text-primary uppercase">
                                    {prod.categoria}
                                  </span>
                                  <span className="font-label-sm text-outline">
                                    Mín: {prod.stockMinimo ?? 3} u.
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded font-label-sm uppercase ${
                                      prod.estadoStock === 'Sin stock'
                                        ? 'bg-error-container/70 text-error'
                                        : isAlert
                                        ? 'bg-secondary-container/50 text-secondary'
                                        : 'bg-pine/30 text-tertiary'
                                    }`}
                                  >
                                    {prod.estadoStock || 'En stock'}
                                  </span>
                                </div>
                                <p className="font-body-sm text-on-surface-bright font-medium">
                                  {prod.nombre}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveStock(prod, Math.max(0, prod.stock - 1))
                                }
                                className="w-8 h-8 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-on-surface-bright flex items-center justify-center"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={currentDraft}
                                onChange={(e) =>
                                  setStockDrafts((prev) => ({
                                    ...prev,
                                    [prod.id]: e.target.value,
                                  }))
                                }
                                className="w-20 text-center bg-surface-container-lowest text-on-surface-bright font-label-lg py-1.5 rounded border border-outline-variant/60"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveStock(prod, prod.stock + 1)
                                }
                                className="w-8 h-8 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-on-surface-bright flex items-center justify-center"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveStock(prod, currentDraft)}
                                className="px-3 py-1.5 rounded bg-primary-container hover:bg-primary text-on-primary font-label-sm uppercase tracking-wider"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 4. SECCIÓN PEDIDOS (Cambio de Estado con transiciones válidas) */}
              {activeSection === 'pedidos' && (
                <div className="rounded bg-surface-container-low border border-outline-variant/60 p-space-lg flex flex-col gap-space-md shadow-xl">
                  <div className="pb-space-sm border-b border-outline-variant/40">
                    <h2 className="font-headline-md text-headline-md text-on-surface-bright">
                      Gestión de Pedidos ({pedidos.length})
                    </h2>
                    <p className="font-body-sm text-outline">
                      Actualizá el estado de despacho respetando el flujo transaccional del servidor.
                    </p>
                  </div>

                  {pedidos.length === 0 ? (
                    <EmptyState
                      kanji="注"
                      icon="receipt_long"
                      title="No hay pedidos registrados"
                      description="Todavía no se han generado órdenes de compra en la plataforma."
                    />
                  ) : (
                    <div className="flex flex-col gap-space-md">
                      {pedidos.map((ped) => {
                        const permitidos =
                          TRANSICIONES_ESTADO_PEDIDO[ped.estado] || [];
                        const opcionesEstado = [ped.estado, ...permitidos];

                        return (
                          <div
                            key={ped.id}
                            className="p-space-md rounded bg-surface-container border border-outline-variant/50 flex flex-col gap-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-outline-variant/30">
                              <div>
                                <span className="font-headline-sm text-primary font-bold">
                                  Pedido #{ped.id}
                                </span>
                                <span className="text-outline font-body-sm ml-3">
                                  {formatDateAR(ped.fecha)}
                                </span>
                                <p className="font-body-sm text-on-surface-variant mt-0.5">
                                  Cliente:{' '}
                                  <strong className="text-on-surface-bright">
                                    {ped.usuarioNombre || 'Cliente Yokai'}
                                  </strong>{' '}
                                  ({ped.usuarioEmail || 'cliente'})
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-headline-sm text-on-surface-bright font-bold">
                                  {formatARS(ped.total)}
                                </span>
                                <select
                                  value={ped.estado}
                                  disabled={permitidos.length === 0}
                                  onChange={(e) =>
                                    handleStatusChange(ped.id, e.target.value)
                                  }
                                  aria-label={`Estado del pedido ${ped.id}`}
                                  className="bg-surface-container-lowest text-primary font-label-md uppercase px-3 py-2 rounded border border-primary-container/60 focus:border-primary outline-none disabled:opacity-60"
                                >
                                  {opcionesEstado.map((est) => (
                                    <option key={est} value={est}>
                                      {ESTADO_PEDIDO_LABEL[est] || est}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="font-body-sm text-outline">
                              <strong className="text-on-surface-variant">
                                Envío:
                              </strong>{' '}
                              {ped.direccionEnvio}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {(ped.detalles || []).map((d, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/40 font-label-sm text-on-surface-variant"
                                >
                                  {d.cantidad}x {d.nombre} ({formatARS(d.precioUnitario)})
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded bg-surface-container-low border border-primary-container/60 p-space-lg shadow-2xl my-8">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/40 mb-space-md">
              <h3 className="font-headline-md text-on-surface-bright">
                {editingProduct
                  ? `Editar Producto #${editingProduct.id}`
                  : 'Nuevo Producto Yokai'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="text-outline hover:text-on-surface-bright"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="grid grid-cols-1 sm:grid-cols-2 gap-space-md"
            >
              <div className="sm:col-span-2">
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Nombre del Componente *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.nombre}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, nombre: e.target.value }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div>
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Categoría Yokai *
                </label>
                <select
                  value={productForm.categoria}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, categoria: e.target.value }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre} ({c.subtitulo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.marca}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, marca: e.target.value }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div>
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Precio en ARS *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={productForm.precio}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, precio: e.target.value }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div>
                <label className="block font-label-sm text-outline uppercase mb-1">
                  SKU (Opcional, se autogenera)
                </label>
                <input
                  type="text"
                  value={productForm.sku}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, sku: e.target.value }))
                  }
                  placeholder="Ej: ONI-RTX4080S"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div>
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Stock Disponible *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, stock: e.target.value }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div>
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Stock Mínimo (Alerta) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={productForm.stockMinimo}
                  onChange={(e) =>
                    setProductForm((p) => ({
                      ...p,
                      stockMinimo: e.target.value,
                    }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Subtítulo Técnico Corto
                </label>
                <input
                  type="text"
                  value={productForm.subtituloCorto}
                  onChange={(e) =>
                    setProductForm((p) => ({
                      ...p,
                      subtituloCorto: e.target.value,
                    }))
                  }
                  placeholder="Ej: 16GB GDDR6X • DLSS 3.5 • Triple Fan"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-label-sm text-outline uppercase mb-1">
                  URL de Imagen (Opcional)
                </label>
                <input
                  type="url"
                  value={productForm.imagen}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, imagen: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Descripción
                </label>
                <textarea
                  rows="2"
                  value={productForm.descripcion}
                  onChange={(e) =>
                    setProductForm((p) => ({ ...p, descripcion: e.target.value }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2 rounded border border-outline-variant/60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Especificaciones (Formato Clave: Valor por línea)
                </label>
                <textarea
                  rows="3"
                  value={productForm.especificacionesTexto}
                  onChange={(e) =>
                    setProductForm((p) => ({
                      ...p,
                      especificacionesTexto: e.target.value,
                    }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2 rounded border border-outline-variant/60 font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded bg-surface-container-high text-on-surface-variant font-label-md uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-md uppercase"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR CATEGORÍA */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded bg-surface-container-low border border-primary-container/60 p-space-lg shadow-2xl">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/40 mb-space-md">
              <h3 className="font-headline-md text-on-surface-bright">
                {editingCategory
                  ? `Editar Categoría ${editingCategory.nombre}`
                  : 'Nueva Categoría Yokai'}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="text-outline hover:text-on-surface-bright"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col gap-space-md">
              <div>
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Nombre Espiritual Yokai *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.nombre}
                  onChange={(e) =>
                    setCategoryForm((c) => ({ ...c, nombre: e.target.value }))
                  }
                  placeholder="Ej: Raijin"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div>
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Rubro de Hardware *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.subtitulo}
                  onChange={(e) =>
                    setCategoryForm((c) => ({ ...c, subtitulo: e.target.value }))
                  }
                  placeholder="Ej: Placas Madre"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-outline uppercase mb-1">
                    Kanji
                  </label>
                  <input
                    type="text"
                    value={categoryForm.kanji}
                    onChange={(e) =>
                      setCategoryForm((c) => ({ ...c, kanji: e.target.value }))
                    }
                    className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-outline uppercase mb-1">
                    Color Acento
                  </label>
                  <select
                    value={categoryForm.acento}
                    onChange={(e) =>
                      setCategoryForm((c) => ({ ...c, acento: e.target.value }))
                    }
                    className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60"
                  >
                    <option value="gold">Dorado Kinpaku</option>
                    <option value="vermilion">Rojo Bermellón</option>
                    <option value="pine">Verde Pino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-outline uppercase mb-1">
                  Descripción
                </label>
                <textarea
                  rows="2"
                  value={categoryForm.descripcion}
                  onChange={(e) =>
                    setCategoryForm((c) => ({
                      ...c,
                      descripcion: e.target.value,
                    }))
                  }
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3 py-2 rounded border border-outline-variant/60"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded bg-surface-container-high text-on-surface-variant font-label-md uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-md uppercase"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
