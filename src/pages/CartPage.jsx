import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import CartItem from '../components/cart/CartItem';
import OrderSummary from '../components/cart/OrderSummary';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function CartPage() {
  const location = useLocation();
  const {
    items,
    syncingCart,
    cartBusy,
    cartError,
    stockConflict,
    clearStockConflict,
    fetchCart,
    totalItems,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { showToast } = useToast();

  const activeConflict = stockConflict || location.state?.stockConflict || null;

  const isItemConflicting = (item) => {
    if (!activeConflict?.productName) return false;
    const conflictName = String(activeConflict.productName).trim().toLowerCase();
    const itemName = String(item?.producto?.nombre || '').trim().toLowerCase();
    return Boolean(
      conflictName &&
        itemName &&
        (itemName === conflictName ||
          itemName.includes(conflictName) ||
          conflictName.includes(itemName))
    );
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-gutter py-space-xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md mb-space-lg pb-space-md border-b border-outline-variant/40">
        <div>
          <div className="flex items-center gap-2 text-outline font-label-sm text-label-sm uppercase tracking-widest mb-2">
            <Link to="/" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-primary">Carrito</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright">
            Tu Carrito de Hardware
          </h1>
          <p className="font-body-md text-body-md text-outline mt-1">
            Revisá las unidades seleccionadas antes de proceder al checkout.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearCart();
              showToast('Se vació el carrito de compras.', 'warning');
            }}
            disabled={cartBusy}
            className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 min-h-[44px] rounded bg-surface-container-low hover:bg-secondary-container/40 border border-outline-variant/60 hover:border-vermilion text-outline hover:text-secondary font-label-md text-label-md uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">
              remove_shopping_cart
            </span>
            <span>Vaciar carrito</span>
          </button>
        )}
      </div>

      {activeConflict && (
        <div
          role="alert"
          className="mb-space-lg p-space-md rounded bg-secondary-container/30 border border-vermilion text-on-surface-bright flex flex-col sm:flex-row sm:items-center justify-between gap-space-md shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-[24px] shrink-0 mt-0.5">
              production_quantity_limits
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-headline-sm text-[16px] text-secondary font-bold">
                {activeConflict.productName
                  ? `Stock insuficiente para "${activeConflict.productName}"`
                  : 'No se pudo confirmar el pedido por falta de stock'}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface">
                {activeConflict.message}
              </p>
              <span className="font-label-sm text-label-sm text-outline">
                Ajustá las unidades en tu carrito para continuar. Tus datos de envío en el checkout fueron conservados.
              </span>
            </div>
          </div>

          {stockConflict && (
            <button
              type="button"
              onClick={clearStockConflict}
              className="px-3 py-1.5 rounded bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 text-outline hover:text-on-surface-bright font-label-sm uppercase tracking-wider shrink-0 self-end sm:self-center"
            >
              Entendido
            </button>
          )}
        </div>
      )}

      {cartError ? (
        <ErrorMessage message={cartError} onRetry={fetchCart} />
      ) : syncingCart && items.length === 0 ? (
        <div className="flex flex-col gap-space-md animate-pulse">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-28 rounded bg-surface-container-low border border-outline-variant/50"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          kanji="空"
          icon="shopping_bag"
          title="Tu carrito está vacío"
          description="Todavía no agregaste componentes a tu configuración. Explorá las 6 categorías Yokai para empezar a armar tu PC."
          actionLabel="Explorar Catálogo"
          actionTo="/catalogo"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          <div className="lg:col-span-8 min-w-0 flex flex-col gap-space-md">
            {items.map((item) => (
              <CartItem
                key={item.id || item.producto.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                isConflicting={isItemConflicting(item)}
                disabled={cartBusy}
              />
            ))}

            <div className="pt-2">
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 font-label-md text-label-md text-primary hover:text-primary-fixed uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[16px]">
                  arrow_back
                </span>
                <span>Seguir agregando componentes</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 min-w-0">
            <OrderSummary
              totalItems={totalItems}
              subtotal={subtotal}
              ctaLabel="Finalizar Compra"
              ctaTo="/checkout"
              busy={cartBusy}
            />
          </div>
        </div>
      )}
    </div>
  );
}
