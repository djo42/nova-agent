class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  load(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      try {
        // If already loaded
        if (window.google?.maps?.places) {
          this.isLoaded = true;
          resolve();
          return;
        }

        // Create callback
        const callback = 'googleMapsCallback';
        window[callback] = () => {
          this.isLoaded = true;
          resolve();
          delete window[callback];
        };

        // Load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callback}`;
        script.async = true;
        script.defer = true;
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });

    return this.loadPromise;
  }
}

export default GoogleMapsLoader; 