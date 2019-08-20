import { Component, OnInit } from '@angular/core';
import { NavController, ModalController } from '@ionic/angular';
import { SesionService } from '../services/sesion.service';
import { CarreraService } from '../services/db/carrera.service';
import { MdlCarrera } from '../modelo/mdlCarrera';
import { MdlCliente } from '../modelo/mdlCliente';
import { LoadingService } from '../services/util/loading.service';
import * as _ from 'lodash'; 
import { DetalleCarreraPage } from '../comun/detalle-carrera/detalle-carrera.page';
import { MdlConductora } from '../modelo/mldConductora';
import { ConductoraService } from '../services/db/conductora.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { NavParamService } from '../services/nav-param.service';

@Component({
  selector: 'app-carreras-aceptadas',
  templateUrl: './carreras-aceptadas.page.html',
  styleUrls: ['./carreras-aceptadas.page.scss'],
})
export class CarrerasAceptadasPage implements OnInit {
  public carreras: MdlCarrera[] = [];
  public carrerasAceptadas: MdlCarrera[] = [];
  public cliente: MdlCliente;
  public conductora: MdlConductora;
  
  filtros = {}
  urlFoto: string;
  
  constructor(
    public navController: NavController,
    public sesionService: SesionService,
    public carreraService: CarreraService,
    public loading: LoadingService,
    public modalController: ModalController,
    public conductoraService: ConductoraService,
    private storage: AngularFireStorage,
    public navParams: NavParamService,
  ) {
    
   }
  ngOnInit() {

    this.sesionService.crearSesionBase()
    .then(() => {
      this.sesionService.getSesion()
        .subscribe((cliente) => {
          if (cliente) {
            this.cliente = cliente;
            this.listaCarerasAceptadas(this.cliente.id, 2);
          } else {
            this.navController.navigateRoot('/login');
          }
        });
    });
  }

  async listaCarerasAceptadas(idUsuario: number, estado: number) {
    this.loading.present();
     await this.carreraService.getCarrerasPorCliente(idUsuario).subscribe( data => {
      this.loading.dismiss();
      this.carreras = Object.assign(data);
      this.filtrarCarrera('estado', estado);
    },  error => {
      this.loading.dismiss();
    });
  }
  public irMapCarrera() {
    this.navController.navigateForward('/map-carrera');
  }


  public filtrarCarrera(atributo: string, valor: any) {
    this.filtros[atributo] = val => val == valor;
    this.carrerasAceptadas = _.filter(this.carreras, _.conforms(this.filtros) )
  }

  async irDetalleCarrera(carrera) {
    const modal = await this.modalController.create({
      component: DetalleCarreraPage,
      componentProps: { 
        carrera: carrera
      }
    });
    return await modal.present();
  }

  public irDetalleConductora(carrera:MdlCarrera) {    
      
    this.conductoraService.getConductora(carrera.idConductora)
      .subscribe( conductora => {
        this.conductora = conductora;
             
          this.storage.ref('mav/conductora/'+conductora.id+'-foto').getDownloadURL()
          .subscribe(ruta => {
            this.urlFoto = ruta;
          }, error => {
            this.urlFoto = undefined;
            //console.error(error);
          });

          this.navParams.set({
            conductora: this.conductora
          });
          this.navController.navigateForward('/detalle-conductora');
      });
     
    
  }

  
}
