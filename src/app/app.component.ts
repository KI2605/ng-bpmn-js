import { Component, ViewChild } from '@angular/core';
import { DiagramEditorComponent } from './diagram-editor/diagram-editor.component';
import * as BpmnJS from 'bpmn-js/dist/bpmn-modeler.production.min.js';
import * as FileSaver from 'file-saver'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ng-bpmn-js';
  diagramFile = '_assets_bpmn_default.bpmn';
  importError?: Error;

  @ViewChild(DiagramEditorComponent) diagramComponent: DiagramEditorComponent;

  loadWorkflow(workflowFile: string): void {
    this.diagramFile = workflowFile;
  }

  clearEditor(): void {
    this.diagramFile = '_assets_bpmn_default.bpmn';
  }

  handleImported(event: any) {
    const {
      type,
      error,
      warnings
    } = event;

    if (type === 'success') {
      console.log(`Rendered diagram (%s warnings)`, warnings.length);
    }

    if (type === 'error') {
      console.error('Failed to render diagram', error);
    }

    this.importError = error;
  }

  async saveWorkFlow(navigateTo?: any): Promise<void> {
    try {
      let bpmnContent: any = await this.diagramComponent.getBpmnContent();
      //bpmnContent.saveXML();
      const blob = new Blob([bpmnContent.xml], {type: 'text/plain;charset=utf-8'});
      FileSaver.saveAs(blob, '/assets/bpmn/default.bpmn');
      console.log(bpmnContent.xml);


    } catch (err) {
      // console.log(err)
    }
  }
}
