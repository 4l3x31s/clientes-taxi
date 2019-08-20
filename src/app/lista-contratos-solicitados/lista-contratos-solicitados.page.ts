import { Component, OnInit } from '@angular/core';
import { MdlContrato } from '../modelo/mdlContrato';
import { LoadingService } from '../services/util/loading.service';
import { ContratoService } from '../services/db/contrato.service';
import { NavController } from '@ionic/angular';
import { MdlCliente } from '../modelo/mdlCliente';
import { SesionService } from '../services/sesion.service';
import * as _ from 'lodash'; 
import { NavParamService } from '../services/nav-param.service';

@Component({
  selector: 'app-lista-contratos-solicitados',
  templateUrl: './lista-contratos-solicitados.page.html',
  styleUrls: ['./lista-contratos-solicitados.page.scss'],
})
export class ListaContratosSolicitadosPage implements OnInit {
  public lstContratos: MdlContrato[] = [];
  public lstContratosFiltrado: MdlContrato[] = [];
  public cliente: MdlCliente;
  filtros = {}
  constructor(
    public contratoService: ContratoService,
    public loading: LoadingService,
    public navController: NavController,
    public sesionService: SesionService,
    public navParamService: NavParamService
    ){ }

  ngOnInit() {
    //this.listarContratos();
    
    this.sesionService.crearSesionBase()
    .then(() => {
      this.sesionService.getSesion()
        .subscribe((cliente) => {
          if (cliente) {
            this.cliente = cliente;
            
            //this.listaContratosPorEstado(this.cliente.id, 0);
            this.listaContratosPorUsuario(this.cliente.id);
          } else {
            this.navController.navigateRoot('/login');
          }
        });
    });

    
  }

  async listaContratosPorUsuario(idUsuario: number) {
    this.loading.present();
    await this.contratoService.listaContratosPorUsuario(idUsuario).subscribe( data => {
      this.loading.dismiss();
      this.lstContratos = Object.assign(data);
      this.filtrarContrato('estado',0);
    },  error => {
      this.loading.dismiss();
    });
  }

  public filtrarContrato(atributo: string, valor: any) {
    this.filtros[atributo] = val => val == valor;
    this.lstContratosFiltrado = _.filter(this.lstContratos, _.conforms(this.filtros) )
  }

  async listaContratosPorEstado(idUsuario: number, estadoContrato: number) {
    this.loading.present();
    await this.contratoService.listaContratosPorEstado(idUsuario,estadoContrato).subscribe( data => {
      this.loading.dismiss();
      this.lstContratos = Object.assign(data);
      this.lstContratosFiltrado = this.lstContratos;
    },  error => {
      this.loading.dismiss();
    });
  }

  public seleccionarContrato(contrato: MdlContrato) {
  
    //this.irActualizarContrato(contrato);
    this.navParamService.set(contrato);
    this.navController.navigateRoot('/detalle-contrato');
  }
}
