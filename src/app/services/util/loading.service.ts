import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  isLoading = false;
  constructor(public loadingController: LoadingController) { }
  async present() {
    this.isLoading = true;
    return await this.loadingController.create({
      spinner: null,
      cssClass: 'spiner-loading'
    }).then(a => {
      const datoa: any = a;
      datoa.present().then(() => {
    
        if (!this.isLoading) {
          datoa.dismiss().then(() => console.log('abort presenting'));
        }
      });
    });
  }

  async dismiss() {
    this.isLoading = false;
    return await this.loadingController.dismiss().then(() => console.log('dismissed'));
  }
}
