import { Module } from '@nestjs/common'
import { ConceptosController } from './conceptos.controller'
import { BuscarConceptoPorDescripcionService } from './service/buscarConceptoPorDescripcion.service'
import { BuscarConceptoPorCodigoService } from './service/buscarConceptoPorCodigo.service'
import { CrudConceptoService } from './service/crudConcepto.service'

@Module({
  controllers: [ConceptosController],
  providers: [
    BuscarConceptoPorDescripcionService,
    BuscarConceptoPorCodigoService,
    CrudConceptoService,
  ],
  imports: [],
})
export class ConceptosModule {}
