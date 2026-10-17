import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import CartItem from '../components/cart/CartItem';
import OrderSummary from '../components/cart/OrderSummary';
import EmptyState from '../components/ui/EmptyState';

export default function CartPage() {
  const { items, totalItems, subtotal, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const { showToast } = useToast();

  return (
    <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
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
            Revisá las unidades seleccionadas antes de proceder al despacho asegurado.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearCart();
              showToast('Se vació el carrito de compras.', 'warning');
            }}
            className="px-4 py-2 rounded bg-surface-container-low hover:bg-secondary-container/40 border border-outline-variant/60 hover:border-vermilion text-outline hover:text-secondary font-label-md text-label-md uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">
              remove_shopping_cart
            </span>
            <span>Vaciar carrito</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
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
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            {items.map((item) => (
              <CartItem
                key={item.producto.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
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

          <div className="lg:col-span-4">
            <OrderSummary
              totalItems={totalItems}
              subtotal={subtotal}
              ctaLabel="Finalizar Compra"
              ctaTo="/checkout"
            />
          </div>
        </div>
      )}
    </div>
  );
}
