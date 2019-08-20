import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  isAlert = false;
  constructor(public alertController: AlertController) { }
  async present(titulo: string, mensaje: string) {
    this.isAlert = true;
    return await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['Aceptar']
    }).then( a => {
      const datoa: any = a;
      datoa.present().then( () => {
      
      });
    });
  }
  async dismiss() {
    this.isAlert = false;
    return await this.alertController.dismiss().then( () => {
    
    });
  }
}
