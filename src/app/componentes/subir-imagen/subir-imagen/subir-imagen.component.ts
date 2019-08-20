import { Component, OnInit, Input } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { LoadingService } from 'src/app/services/util/loading.service';
import { AlertService } from 'src/app/services/util/alert.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'subir-imagen',
  templateUrl: './subir-imagen.component.html',
  styleUrls: ['./subir-imagen.component.scss'],
})
export class SubirImagenComponent implements OnInit {

  @Input("titulo")
  titulo: string;

  @Input("url-imagen")
  urlImagen: string;

  @Input("soloLectura")
  soloLectura: boolean;

  urlImagenFirebase: string;
  cargandoImagen: boolean = false;
  cargando:any;

  constructor(
    private storage: AngularFireStorage,
    public loadingService: LoadingService,
    public alertService: AlertService,
    public alertController: AlertController
  ) { }

  ngOnInit() {
    
    this.cargandoImagen = true;
    this.storage.ref(this.urlImagen).getDownloadURL()
      .subscribe(ruta => {
        this.urlImagenFirebase = ruta;
        this.cargandoImagen = false;
      }, error => {
        this.cargandoImagen = false;
      });
  }

  async eliminarImagen() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Esta segura de eliminar la imagen?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {

          }
        }, {
          text: 'Continuar',
          cssClass: 'primary',
          handler: () => {
            this.loadingService.present()
              .then(() => {
                this.storage.ref(this.urlImagen).delete()
                  .subscribe(() => {
                    this.urlImagenFirebase = undefined;
                    this.loadingService.dismiss();
                  });
              });
          }
        }
      ]
    });

    await alert.present();
  }

  uploadImagen(event) {
    let upload: AngularFireUploadTask;
    this.loadingService.present()
      .then(() => {
        upload = this.storage.upload(this.urlImagen, event.target.files[0]);
        upload.then(() => {
          this.cargandoImagen = true;
          this.storage.ref(this.urlImagen).getDownloadURL()
            .subscribe(ruta => {
              this.cargandoImagen = false;
              this.urlImagenFirebase = ruta;
            },error=>{
              this.cargandoImagen = false;
            });
          this.loadingService.dismiss();
          this.alertService.present('Info', 'Imagen subida correctamente.');
        }).catch(e => {

          this.loadingService.dismiss();
          this.alertService.present('Error', 'Error al subir la imagen.');
        });
      });
  }

}
