import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from "@angular/forms";
import { NavController, ModalController, ActionSheetController } from '@ionic/angular';

import { MdlConductora } from 'src/app/modelo/mldConductora';
import { MdlParametrosCarrera } from 'src/app/modelo/mdlParametrosCarrera';
import { AlertService } from 'src/app/services/util/alert.service';
import { LoadingService } from 'src/app/services/util/loading.service';
import { SesionService } from 'src/app/services/sesion.service';
import { NavParamService } from 'src/app/services/nav-param.service';
import { ParametrosCarreraService } from 'src/app/services/db/parametros-carrera.service';
import { ConductoraService } from 'src/app/services/db/conductora.service';
import { VehiculoService } from 'src/app/services/db/vehiculo.service';
import { MdlVehiculo } from 'src/app/modelo/mdlVehiculo';

@Component({
  selector: 'app-detalle-conductora',
  templateUrl: './detalle-conductora.page.html',
  styleUrls: ['./detalle-conductora.page.scss'],
})
export class DetalleConductoraPage implements OnInit {

  form: FormGroup;

  conductora: MdlConductora;
  vehiculo: MdlVehiculo;

  public lstPaisesFiltrados = [];
  public lstCiudadesFiltrado: MdlParametrosCarrera [] = [];
  public lstParametros: MdlParametrosCarrera [] = [];
  public isSesionAdmin: boolean = false;

  constructor(
    public fb: FormBuilder,
    public conductoraService: ConductoraService,
    public alertService: AlertService,
    public loadingService: LoadingService,
    public sesionService: SesionService,
    public navController: NavController,
    public navParam: NavParamService,
    public modalController: ModalController,
    public parametrosService: ParametrosCarreraService,
    public actionSheetController: ActionSheetController,
    public vehiculoService: VehiculoService,
  ) { }

  iniciarValidaciones() {
    this.form = this.fb.group({
      vPais: ['', [
        Validators.required
      ]],
      vCiudad: ['', [
        Validators.required
      ]],
    });
  }

  get f() { return this.form.controls; }

  ngOnInit() {
    this.iniciarValidaciones();
    if (this.navParam.get() && this.navParam.get().conductora){
      this.conductora = this.navParam.get().conductora;

      this.vehiculoService.getVehiculoPorConductora(this.conductora.id)
        .subscribe(vehiculo=>{          
          if(vehiculo[0]){
            this.vehiculo=vehiculo[0];

          } else {

            this.vehiculo = new MdlVehiculo(
              null,this.conductora.id,null,null,null
            );
          }
        }); 
    } else {
      this.conductora = new MdlConductora(
        null, null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null, null, false, false
      );
    }
    this.obtenerParametros();

  }

  obtenerParametros() {
    this.loadingService.present()
      .then(() => {
        this.parametrosService.listarParametros().subscribe(data => {
          this.loadingService.dismiss();
          this.lstParametros = Object.assign(data);
          this.lstPaisesFiltrados = Array.from(new Set(this.lstParametros.map(s => s.pais)))
          .map(id => {
            return {
              id: id,
              pais: this.lstParametros.find( s => s.pais === id).pais,
            };
          });
          this.filtrarCiudades(this.lstParametros[0].pais);
        }, error => {

        });
      });
  }

  filtrarCiudades(event) {
    this.lstCiudadesFiltrado = this.lstParametros.filter(
      parametros => parametros.pais.indexOf(event) > -1
    );
  }
 
}
