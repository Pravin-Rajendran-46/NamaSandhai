// frontend/scripts/app.js
class NammaSandhaiApp {
     constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api'
            : 'https://your-backend.railway.app/api';
        this.products = [];
        this.currentPage = 1;
        this.productsPerPage = 20;
        this.supabaseUrl = 'https://tosjqgjhlhefoiaadjvp.supabase.co';
        this.supabaseKey = 'your-anon-key-here'; // Use environment variable in production
        this.supabase = window.supabase || this.initSupabase();
        this.init();
    }

    initSupabase() {
        // Create Supabase client
        return supabase.createClient(this.supabaseUrl, this.supabaseKey);
    }

    async init() {
        // Load products on home page
        if (document.getElementById('products-grid')) {
            await this.loadProducts();
            this.setupEventListeners();
        }

        // Initialize product detail page
        if (document.getElementById('product-detail')) {
            await this.loadProductDetail();
        }

        // Initialize sell form
        if (document.getElementById('sell-form')) {
            this.initializeSellForm();
        }
    }

    async loadProducts() {
        const loading = document.getElementById('loading');
        const productsGrid = document.getElementById('products-grid');
        
        if (loading) loading.style.display = 'block';
        if (productsGrid) productsGrid.innerHTML = '';

        try {
            const userLocation = window.locationService.getCurrentLocation();
            const response = await fetch(
                `${this.apiBaseUrl}/products/nearby?lat=${userLocation.latitude}&lng=${userLocation.longitude}`
            );
            const data = await response.json();
            this.products = data.data || [];
            // Query products from Supabase
            let query = this.supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(this.productsPerPage);

            // Filter by location if available
            if (userLocation.latitude && userLocation.longitude) {
                // Get nearby products (within 50km)
                const nearbyProducts = await this.getNearbyProducts(
                    userLocation.latitude,
                    userLocation.longitude,
                    50
                );
                this.products = nearbyProducts;
            } else {
                // Fallback: get all products
                const { data, error } = await query;
                if (error) throw error;
                this.products = data || [];
            }

            this.displayProducts();
            this.insertAds();
            
        } catch (error) {

            cconsole.error('Error loading products:', error);
            this.showError('Failed to load products. Please try again.');
        } finally {
            if (loading) loading.style.display = 'none';
        }
    }

    async getNearbyProducts(lat, lng, radiusKm) {
        try {
            // This would be implemented in a backend function
            // For MVP, we'll do client-side filtering
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculate distances and filter
            return data.filter(product => {
                if (!product.latitude || !product.longitude) return true;
                
                const distance = window.locationService.calculateDistance(
                    lat, lng,
                    product.latitude,
                    product.longitude
                );
                
                return distance <= radiusKm;
            }).sort((a, b) => {
                // Sort by distance
                const distA = window.locationService.calculateDistance(
                    lat, lng,
                    a.latitude,
                    a.longitude
                );
                const distB = window.locationService.calculateDistance(
                    lat, lng,
                    b.latitude,
                    b.longitude
                );
                return distA - distB;
            });

        } catch (error) {
            console.error('Error getting nearby products:', error);
            return [];
        }
    }

    displayProducts() {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;

        if (this.products.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--gray);"></i>
                    <h3>No products found in your area</h3>
                    <p>Try changing your location or check back later</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.products.forEach((product, index) => {
            html += this.createProductCard(product);
            
            // Insert ad after every 5 products
            if ((index + 1) % 5 === 0 && index !== this.products.length - 1) {
                html += `<div class="ad-slot" id="ad-slot-${Math.floor(index/5) + 1}">
                    <div class="ad-label">Advertisement</div>
                    <!-- Ad will be injected here -->
                </div>`;
            }
        });

        productsGrid.innerHTML = html;
        this.setupProductCardListeners();
    }

    createProductCard(product) {
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0] 
            : 'https://via.placeholder.com/300x200?text=No+Image';
        
        const price = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(product.price);

        return `
            <div class="product-card" data-id="${product.id}">
                <img src="${imageUrl}" alt="${product.title}" class="product-image">
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
                    <div class="product-price">${price}</div>
                    <div class="product-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${product.location_area || ''}
                    </div>
                    <div class="product-actions">
                        <a href="product-detail.html?id=${product.id}" class="btn-view">
                            <i class="fas fa-eye"></i> View
                        </a>
                        <a href="https://wa.me/${product.seller_phone}?text=Hi,%20I%20am%20interested%20in%20your%20product:%20${encodeURIComponent(product.title)}" 
                           target="_blank" class="btn-contact">
                            <i class="fab fa-whatsapp"></i> Contact
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    async loadProductDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const { data: product, error } = await this.supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error || !product) {
                throw new Error('Product not found');
            }

            this.displayProductDetail(product);
            this.setupShareButtons(product);

        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Product not found');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }

    displayProductDetail(product) {
        const container = document.getElementById('product-detail');
        if (!container) return;

        const price = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(product.price);

        // Create image gallery
        let galleryHtml = '';
        if (product.images && product.images.length > 0) {
            galleryHtml = `
                <div class="product-gallery">
                    <img src="${product.images[0]}" alt="${product.title}" class="gallery-main" id="main-image">
                    <div class="gallery-thumbnails">
                        ${product.images.map((img, index) => `
                            <img src="${img}" alt="${product.title} - ${index + 1}" 
                                 class="thumbnail ${index === 0 ? 'active' : ''}"
                                 onclick="document.getElementById('main-image').src='${img}'; 
                                          document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                                          this.classList.add('active');">
                        `).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="product-detail-container">
                ${galleryHtml}
                <div class="product-details">
                    <span class="detail-category">${product.category}</span>
                    <h1>${product.title}</h1>
                    <div class="detail-price">${price}</div>
                    
                    <div class="detail-meta">
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${product.location_area}, ${product.location_city}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>Posted ${this.formatDate(product.created_at)}</span>
                        </div>
                    </div>

                    <div class="detail-description">
                        <h3>Description</h3>
                        <p>${product.description}</p>
                    </div>

                    ${this.getConditionalFields(product)}

                    <div class="seller-info">
                        <h3>Seller Information</h3>
                        <p><strong>${product.seller_name}</strong></p>
                        
                        <div class="contact-buttons">
                            <a href="https://wa.me/${product.seller_phone}?text=Hi%20${encodeURIComponent(product.seller_name)},%20I%20am%20interested%20in%20your%20product:%20${encodeURIComponent(product.title)}" 
                               target="_blank" class="contact-btn btn-whatsapp">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </a>
                            
                            <a href="tel:${product.seller_phone}" class="contact-btn btn-phone">
                                <i class="fas fa-phone"></i> Call
                            </a>
                            
                            ${product.seller_alternative_phone ? `
                            <a href="tel:${product.seller_alternative_phone}" class="contact-btn btn-phone">
                                <i class="fas fa-phone-alt"></i> Alt. Phone
                            </a>
                            ` : ''}
                            
                            ${product.seller_email ? `
                            <a href="mailto:${product.seller_email}?subject=Regarding%20your%20product:%20${encodeURIComponent(product.title)}" 
                               class="contact-btn btn-email">
                                <i class="fas fa-envelope"></i> Email
                            </a>
                            ` : ''}
                        </div>
                    </div>

                    <div class="share-section">
                        <h4>Share this product</h4>
                        <div class="share-buttons">
                            <a href="#" class="share-btn share-fb" onclick="shareOnFacebook()">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" class="share-btn share-twitter" onclick="shareOnTwitter()">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="#" class="share-btn share-whatsapp" onclick="shareOnWhatsApp()">
                                <i class="fab fa-whatsapp"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ad-slot" id="product-ad">
                <div class="ad-label">Advertisement</div>
                <!-- Ad will be injected here -->
            </div>
        `;
    }

    getConditionalFields(product) {
        let fields = '';
        
        if (product.condition) {
            fields += `<div class="detail-field"><strong>Condition:</strong> ${product.condition}</div>`;
        }
        
        if (product.brand) {
            fields += `<div class="detail-field"><strong>Brand:</strong> ${product.brand}</div>`;
        }
        
        if (product.size) {
            fields += `<div class="detail-field"><strong>Size:</strong> ${product.size}</div>`;
        }
        
        if (product.material) {
            fields += `<div class="detail-field"><strong>Material:</strong> ${product.material}</div>`;
        }
        
        if (fields) {
            return `<div class="conditional-fields">${fields}</div>`;
        }
        
        return '';
    }

    initializeSellForm() {
        const form = document.getElementById('sell-form');
        const categorySelect = document.getElementById('category');
        const conditionalFields = document.getElementById('conditional-fields');
        const imageUpload = document.getElementById('image-upload');
        const imagePreview = document.getElementById('image-preview');
        const imagesInput = document.getElementById('images');
        const images = [];

        // Handle category change for conditional fields
        if (categorySelect) {
            categorySelect.addEventListener('change', function() {
                const category = this.value;
                let html = '';
                
                if (category === 'electronics') {
                    html = `
                        <div class="form-group">
                            <label for="brand">Brand *</label>
                            <input type="text" id="brand" name="brand" required>
                        </div>
                        <div class="form-group">
                            <label for="condition">Condition *</label>
                            <select id="condition" name="condition" required>
                                <option value="">Select</option>
                                <option value="new">New</option>
                                <option value="like_new">Like New</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                            </select>
                        </div>
                    `;
                } else if (category === 'furniture') {
                    html = `
                        <div class="form-group">
                            <label for="size">Size</label>
                            <input type="text" id="size" name="size" placeholder="e.g., 5x3 feet">
                        </div>
                        <div class="form-group">
                            <label for="material">Material</label>
                            <input type="text" id="material" name="material" placeholder="e.g., Wood, Metal">
                        </div>
                    `;
                }
                
                conditionalFields.innerHTML = html;
            });
        }

        // Handle image upload
        if (imageUpload) {
            imageUpload.addEventListener('click', () => {
                imagesInput.click();
            });

            imagesInput.addEventListener('change', function(e) {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                    if (file.size > 5 * 1024 * 1024) {
                        alert('File size should be less than 5MB');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const imageUrl = e.target.result;
                        images.push(imageUrl);
                        
                        const imgElement = document.createElement('div');
                        imgElement.className = 'preview-image-container';
                        imgElement.innerHTML = `
                            <img src="${imageUrl}" class="preview-image">
                            <button type="button" class="remove-image" onclick="this.parentElement.remove(); 
                                images.splice(images.indexOf('${imageUrl}'), 1);">
                                &times;
                            </button>
                        `;
                        
                        imagePreview.appendChild(imgElement);
                    };
                    reader.readAsDataURL(file);
                });
            });
        }

        // Handle location detection
        const detectLocationBtn = document.getElementById('detect-location');
        if (detectLocationBtn) {
            detectLocationBtn.addEventListener('click', async () => {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    
                    document.getElementById('latitude').value = position.coords.latitude;
                    document.getElementById('longitude').value = position.coords.longitude;
                    
                    // Reverse geocode
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                    );
                    const data = await response.json();
                    
                    if (data.address) {
                        document.getElementById('location_city').value = 
                            data.address.city || data.address.town || '';
                        document.getElementById('location_area').value = 
                            data.address.suburb || data.address.neighbourhood || '';
                    }
                    
                } catch (error) {
                    alert('Could not detect location. Please enter manually.');
                }
            });
        }

        // Handle form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const productData = {
                    title: formData.get('title'),
                    category: formData.get('category'),
                    description: formData.get('description'),
                    price: parseFloat(formData.get('price')),
                    images: images,
                    seller_name: formData.get('seller_name'),
                    seller_phone: formData.get('seller_phone'),
                    seller_alternative_phone: formData.get('seller_alternative_phone'),
                    seller_email: formData.get('seller_email'),
                    latitude: parseFloat(formData.get('latitude')) || null,
                    longitude: parseFloat(formData.get('longitude')) || null,
                    location_city: formData.get('location_city'),
                    location_area: formData.get('location_area'),
                    condition: formData.get('condition'),
                    brand: formData.get('brand'),
                    size: formData.get('size'),
                    material: formData.get('material')
                };

                try {
                    const { data, error } = await this.supabase
                        .from('products')
                        .insert([productData]);

                    if (error) throw error;

                    alert('Product listed successfully!');
                    form.reset();
                    imagePreview.innerHTML = '';
                    images.length = 0;
                    
                    // Redirect to home page
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);

                } catch (error) {
                    console.error('Error submitting product:', error);
                    alert('Failed to list product. Please try again.');
                }
            });
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-IN');
        }
    }

    setupShareButtons(product) {
        window.shareOnFacebook = () => {
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        };

        window.shareOnTwitter = () => {
            const text = encodeURIComponent(`Check out this product: ${product.title}`);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        };

        window.shareOnWhatsApp = () => {
            const text = encodeURIComponent(`Check out this product: ${product.title}\n${window.location.href}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        };
    }

    setupEventListeners() {
        // Setup any additional event listeners here
    }

    showError(message) {
        const container = document.getElementById('products-grid') || document.getElementById('product-detail');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${message}</h3>
                </div>
            `;
        }
    }

    insertAds() {
        // This will be implemented in ads.js
        // For now, we'll just mark ad slots
        const adSlots = document.querySelectorAll('.ad-slot');
        adSlots.forEach(slot => {
            slot.innerHTML += `
                <div style="color: var(--gray); font-size: 0.9rem;">
                    Advertisement slot - Replace with Google AdSense code
                </div>
            `;
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NammaSandhaiApp();
    window.loadProducts = () => window.app.loadProducts();
});