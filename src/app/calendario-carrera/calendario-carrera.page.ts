import { Component, OnInit, ViewChild } from '@angular/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CarreraService } from '../services/db/carrera.service';
import { SesionService } from '../services/sesion.service';
import { LoadingService } from '../services/util/loading.service';
import interactionPlugin from '@fullcalendar/interaction'; // for dateClick
import { MdlCarrera } from '../modelo/mdlCarrera';
import { AlertService } from '../services/util/alert.service';
import { NavController, ModalController } from '@ionic/angular';
import { EventInput } from '@fullcalendar/core';
import { MdlCliente } from '../modelo/mdlCliente';
import { DetalleCarreraPage } from '../comun/detalle-carrera/detalle-carrera.page';
import { ClienteService } from '../services/db/cliente.service';

@Component({
  selector: 'app-calendario-carrera',
  templateUrl: './calendario-carrera.page.html',
  styleUrls: ['./calendario-carrera.page.scss'],
})
export class CalendarioCarreraPage implements OnInit {

  calendarPlugins = [dayGridPlugin, interactionPlugin];

  @ViewChild('calendar')
  calendarComponent: FullCalendarComponent;

  cliente: MdlCliente;
  carreras: MdlCarrera[];
  calendarEvents: EventInput[] = [];

  constructor(
    public carreraService: CarreraService,
    public sesionService: SesionService,
    public loadingService: LoadingService,
    public alertService: AlertService,
    public navController: NavController,
    public modalController: ModalController,
    public clienteService: ClienteService,
  ) { }

  ngOnInit() {
    this.loadingService.present()
      .then(() => {
        this.sesionService.getSesion()
          .subscribe(cliente => {
            this.cliente = cliente;
            this.carreraService.getCarrerasPorCliente(this.cliente.id)
              .subscribe(carreras => {
                this.loadingService.dismiss();
                this.carreras = carreras;
                this.calendarEvents = [];
                if (this.carreras && this.carreras.length > 0) {
                  this.carreras.forEach(element => {
                    let nomConductora = '';
                    if(element.nombreConductora) {
                      nomConductora = element.nombreConductora;
                    }
                    this.calendarEvents = this.calendarEvents.concat({
                      title: element.costo + 'Bs. ' + nomConductora,
                      start: element.fechaInicio,
                      idCarrera: element.id,
                      backgroundColor: this.clienteService.getColorPorCliente(element.idUsuario)
                    })
                  });
                }
              },
              error => {
                console.error(error);
                this.alertService.present('Error', 'Error al recuperar las carreras.');
                this.navController.navigateRoot('/login');
              })
          }, e => {
            console.error(e);
            this.alertService.present('Error', 'Error al recuperar sesion.');
            this.navController.navigateRoot('/login');
          })
      });
  }

  handleDateClick(event) {

  }

  async handleEventClick(event) {
    let carreraSeleccionada:MdlCarrera = this.carreras.find(x => x.id == event.event.extendedProps.idCarrera);

    const modal = await this.modalController.create({
      component: DetalleCarreraPage,
      componentProps: { 
        carrera: carreraSeleccionada
      }
    });
    return await modal.present();
  }
}