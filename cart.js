class ShoppingCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('electrohub-cart')) || [];
        this.updateCartCount();
    }
    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.updateCartCount();
    }
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCount();
    }
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = parseInt(quantity);
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            }
        }
        this.saveCart();
        this.updateCartCount();
    }
    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    getCart() {
        return this.cart;
    }
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
    }
    saveCart() {
        localStorage.setItem('electrohub-cart', JSON.stringify(this.cart));
    }
    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }
}
// Global cart instance
const cart = new ShoppingCart();