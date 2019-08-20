import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { MdlCliente } from '../modelo/mdlCliente';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { ClienteService } from './db/cliente.service';
import { AlertController, NavController, Events } from '@ionic/angular';
import { LoadingService } from './util/loading.service';
import { AlertService } from './util/alert.service';


@Injectable({
  providedIn: 'root'
})
export class SesionService {

  clienteSesionPrueba: MdlCliente;
  

  constructor(
    public sesionService: SesionService,
    public sqlite: SqliteService,
    public alertController: AlertController,
    public loadingService: LoadingService,
    public alertService: AlertService,
    public clienteService: ClienteService,
    public navController: NavController,
    public events: Events
  ) { }

  public login(user: string) : Observable<any> {
    return new Observable<boolean>(observer => {
      this.clienteService.getClientePorUser(user)
        .subscribe(cliente=>{
          if(cliente){
            if(environment.isSesionPrueba){
              this.clienteSesionPrueba = cliente[0];
              //this.clienteSesionPrueba.nombre += '(PRUEBA)';
             
            } else {
              this.sqlite.setclienteSesion(cliente[0]);
            }
            observer.next();
          } else {
            observer.error({message:'Usuario y/o contraseña inválida'});
          }
          observer.complete();
        });
    });
  }

  getSesion(): Observable<MdlCliente> {
    return new Observable<MdlCliente>(observer => {
      if(environment.isSesionPrueba){
        observer.next(this.clienteSesionPrueba);
        observer.complete();
      } else {
        this.sqlite.getclienteSesion()
          .then(idCliente=>{
            this.clienteService.getCliente(idCliente)
              .subscribe(cliente => {
                observer.next(cliente);
                observer.complete();
              });
          });
      }
    });
  }

  crearSesionBase(): Promise<any> {
    if(environment.isSesionPrueba){
      return Promise.resolve()
    } else {
      return this.sqlite.crearBD();
    }
  }

  cerrarSesion(): Promise<any>{
    if(environment.isSesionPrueba){
      this.clienteSesionPrueba=undefined;
      return Promise.resolve()
    } else {
      return this.sqlite.removeClienteSesion();
    }
  }

  async irCerrarSesion(){
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Esta segur@ de cerrar su sesión?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
      
          }
        }, {
          text: 'Si',
          cssClass: 'primary',
          handler: () => {
            this.loadingService.present()
              .then(() => {
                this.sesionService.cerrarSesion()
                  .then(()=>{
                    this.events.publish('user:logout');
                    this.loadingService.dismiss();
                    this.navController.navigateRoot('/login');
                  })
                  .catch(e=>{
            
                    this.alertService.present('Error','Error al cerrar la sesion');
                    this.loadingService.dismiss();
                  })
              });
          }
        }
      ]
    });

    await alert.present();
  }
}
