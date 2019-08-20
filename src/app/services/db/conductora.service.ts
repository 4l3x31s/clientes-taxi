import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { UtilService } from '../util/util.service';
import { MdlConductora } from 'src/app/modelo/mldConductora';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConductoraService {

  constructor(
    public afDB: AngularFireDatabase,
    public utilService: UtilService
  ) { }

  /**
   * Para revisar datos:
   * https://mav-db.firebaseio.com/conductora.json
   */
  grabarConductora(conductora: MdlConductora): Promise<MdlConductora> {
    if (!conductora.id) {
      conductora.id = Date.now();
    }
    return this.afDB.database.ref('conductora/' + conductora.id)
              .set(this.utilService.serializar(conductora))
                .then(()=>{
                  return Promise.resolve(conductora);
                })
                .catch(e=>{
                  return Promise.reject(e);
                });
  }
  getConductoraPorUserPass(user: string, pass: string): Observable<MdlConductora[]> {
    return new Observable<MdlConductora[]>(observer => {
      this.afDB.list<MdlConductora>('conductora/',
        ref => ref.orderByChild('user').equalTo(user)).valueChanges()
        .subscribe(conductoras => {
          if (conductoras.length > 0 && pass === conductoras[0].pass) {
            observer.next(conductoras);
          } else {
            observer.next();
          }
          observer.complete();
        });
    });
  }

  getConductora(id: number): Observable<MdlConductora> {
    return this.afDB.object<MdlConductora>('conductora/' + id).valueChanges();
  }

  listaConductoras() {
    return this.afDB.list('conductora').valueChanges();
  }
  getConductoraPorPaisCiudad(pais: string, ciudad: string): Observable<MdlConductora[]> {
    return new Observable<MdlConductora[]>(observer => {
      this.afDB.list<MdlConductora>('conductora/',
        ref => ref.orderByChild('pais').equalTo(pais)).valueChanges()
        .subscribe(conductoras => {
        
          if (conductoras.length > 0 && ciudad === conductoras[0].ciudad) {
            observer.next(conductoras);
          } else {
            observer.next();
          }
          observer.complete();
        });
    });
  }

  getConductoraPorEmail(email: string): Observable<MdlConductora[]> {
    return this.afDB.list<MdlConductora>('conductora',
      ref => ref.orderByChild('email').equalTo(email)).valueChanges();
  }

  getConductoraPorCelular(celular: number): Observable<MdlConductora[]> {
    return this.afDB.list<MdlConductora>('conductora',
      ref => ref.orderByChild('celular').equalTo(celular)).valueChanges();
  }
  
}
