// frontend/scripts/location.js
class LocationService {
    constructor() {
        this.userLocation = {
            latitude: null,
            longitude: null,
            city: 'Chennai',
            area: 'City Center',
            detected: false
        };
        this.init();
    }

    async init() {
        // Try to get saved location from localStorage
        const savedLocation = localStorage.getItem('nammaSandhaiLocation');
        if (savedLocation) {
            this.userLocation = JSON.parse(savedLocation);
            this.updateLocationUI();
        } else {
            // Try auto-detection
            await this.autoDetectLocation();
        }
    }

    async autoDetectLocation() {
        if (!navigator.geolocation) {
            this.showLocationModal();
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });

            this.userLocation.latitude = position.coords.latitude;
            this.userLocation.longitude = position.coords.longitude;
            this.userLocation.detected = true;

            // Reverse geocoding using OpenStreetMap
            await this.reverseGeocode();

            // Save to localStorage
            localStorage.setItem('nammaSandhaiLocation', JSON.stringify(this.userLocation));
            
            this.updateLocationUI();
        } catch (error) {
            console.warn('Location detection failed:', error);
            this.showLocationModal();
        }
    }

    async reverseGeocode() {
        try {
            const { latitude, longitude } = this.userLocation;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            
            const data = await response.json();
            
            if (data.address) {
                this.userLocation.city = data.address.city || data.address.town || data.address.village || 'Unknown City';
                this.userLocation.area = data.address.suburb || data.address.neighbourhood || data.address.road || 'Unknown Area';
            }
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            // Fallback to default
            this.userLocation.city = 'Chennai';
            this.userLocation.area = 'City Center';
        }
    }

    updateLocationUI() {
        const locationElement = document.getElementById('current-location');
        const locationText = document.getElementById('location-text');
        
        if (locationElement) {
            locationElement.textContent = `${this.userLocation.area}, ${this.userLocation.city}`;
        }
        
        if (locationText) {
            locationText.textContent = `${this.userLocation.area}, ${this.userLocation.city}`;
        }
        
        // Trigger products reload if on home page
        if (window.loadProducts) {
            window.loadProducts();
        }
    }

    showLocationModal() {
        const modal = document.getElementById('location-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideLocationModal() {
        const modal = document.getElementById('location-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    setManualLocation(city, area) {
        this.userLocation.city = city || 'Chennai';
        this.userLocation.area = area || 'City Center';
        this.userLocation.detected = false;
        this.userLocation.latitude = null;
        this.userLocation.longitude = null;
        
        localStorage.setItem('nammaSandhaiLocation', JSON.stringify(this.userLocation));
        this.updateLocationUI();
        this.hideLocationModal();
    }

    getCurrentLocation() {
        return this.userLocation;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula to calculate distance between two coordinates
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
}

// Initialize location service
window.locationService = new LocationService();

// Event Listeners for Location Modal
document.addEventListener('DOMContentLoaded', function() {
    const locationModal = document.getElementById('location-modal');
    const changeLocationBtn = document.getElementById('change-location');
    const autoLocateBtn = document.getElementById('auto-locate');
    const saveLocationBtn = document.getElementById('save-location');
    const closeModalBtn = document.getElementById('close-modal');

    if (changeLocationBtn) {
        changeLocationBtn.addEventListener('click', () => {
            locationService.showLocationModal();
        });
    }

    if (autoLocateBtn) {
        autoLocateBtn.addEventListener('click', async () => {
            await locationService.autoDetectLocation();
            locationService.hideLocationModal();
        });
    }

    if (saveLocationBtn) {
        saveLocationBtn.addEventListener('click', () => {
            const city = document.getElementById('city').value;
            const area = document.getElementById('area').value;
            locationService.setManualLocation(city, area);
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            locationService.hideLocationModal();
        });
    }

    // Close modal when clicking outside
    if (locationModal) {
        locationModal.addEventListener('click', (e) => {
            if (e.target === locationModal) {
                locationService.hideLocationModal();
            }
        });
    }
});