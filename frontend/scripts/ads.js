// frontend/scripts/ads.js
class AdManager {
    constructor() {
        this.adSlots = [
            'ad-slot-1',
            'ad-slot-2',
            'ad-slot-3',
            'footer-ad',
            'product-ad'
        ];
        this.adsEnabled = true;
        this.init();
    }

    init() {
        if (!this.adsEnabled) return;
        
        // Load Google AdSense script
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
        
        // Initialize ads after script loads
        script.onload = () => {
            this.insertAds();
        };
    }

    insertAds() {
        this.adSlots.forEach(slotId => {
            const slot = document.getElementById(slotId);
            if (slot) {
                this.createAd(slot, slotId);
            }
        });
    }

    createAd(container, slotId) {
        // Replace with your actual AdSense code
        const adHtml = `
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="YOUR_AD_CLIENT_ID"
                 data-ad-slot="YOUR_AD_SLOT_ID"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
        `;
        
        container.innerHTML = adHtml;
    }

    isSafeZone(element) {
        // Check if ad is in safe zone
        const rect = element.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        
        return isVisible;
    }
}

// Initialize ad manager
document.addEventListener('DOMContentLoaded', () => {
    window.adManager = new AdManager();
});