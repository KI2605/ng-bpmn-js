import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as BpmnJS from 'bpmn-js/dist/bpmn-modeler.production.min.js';
import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import { from, Observable, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import customControlsModule from 'src/app/custom-bpmnjs/palette';
import customPropertiesProviderModule from 'src/app/custom-bpmnjs/properties/provider/custom';
import customModdleDescriptor from 'src/app/custom-bpmnjs/properties/descriptors/custom.json';
import taskTemplate from 'src/app/custom-bpmnjs/element-templates/task-template.json';
import ColorPickerModule from 'src/app/custom-bpmnjs/colors';
import { DiagramElement } from '../models/diagram-element';
//import testTemplate from 'src/app/custom-bpmnjs/element-templates/test.json';
//import sampleTemplate from 'camunda-modeler/resources/element-templates/samples.json';

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram-editor.component.html',
  styleUrls: ['./diagram-editor.component.scss']
})
export class DiagramEditorComponent implements OnInit {
  private bpmnJS: BpmnJS;
  private myTasks: any[];

  public previousElementForAddSubPr: DiagramElement = new DiagramElement();
  public currentElementForAddSubPr: DiagramElement = new DiagramElement();
  isAddButtonShown: boolean;

  private overlays;

  @ViewChild('ref', { static: true }) private el!: ElementRef;
  @Output() private importDone: EventEmitter<any> = new EventEmitter();
  @Input() public file: string;
  ngrxStore: any;

  constructor(
    private http: HttpClient
  ) {
  }

  onClick(event) {
    console.log(event);
  }

  addSubProcess() {
    
  }

  ngOnInit(): void {
    /*     this.getServiceTasks().subscribe(data => {
          sessionStorage.setItem("serviceTasks", data);
        });
     */
    this.myTasks = [
      {
        "name": "Task Template",
        "id": "taskTemplate",
        "appliesTo": ["bpmn:ServiceTask"],
        "properties": [
          {
            "label": "Tasks",
            "type": "String",
            "editable": true,
            "binding": {
              "type": "property",
              "name": "camunda:class"
            }
          }
        ]
      }
    ];

    this.initBpmn();
  }

  initBpmn(): void {
    this.bpmnJS = new BpmnJS({
      propertiesPanel: {
        parent: '#properties'
      },
      additionalModules: [
        propertiesPanelModule,
        propertiesProviderModule,
        customControlsModule,
        customPropertiesProviderModule,
        ColorPickerModule
      ],
      elementTemplates: taskTemplate,
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
        custom: customModdleDescriptor
      },
      keyboard: {
        bindTo: document
      }
    });

    this.bpmnJS.on('import.done', ({ error }: { error: any }) => {
      if (!error) {
        this.bpmnJS.get('canvas').zoom('fit-viewport');
      }
    });

    this.bpmnJS.on('elementTemplates.errors', function (event) {
      console.log('template load errors', event.errors);
    });
    this.bpmnJS.get('elementTemplatesLoader').reload();

    let aid;
    let atype;
    var eventBus = this.bpmnJS.get('eventBus');

      // you may hook into any of the following events
      var events = [
        // 'element.hover',
        // 'element.out',
        'element.click',
        'element.dblclick',
        // 'element.mousedown',
        // 'element.mouseup'
      ];

      events.forEach((event) => {

        eventBus.on(event, (e) => {
          // e.element = the model element
          // e.gfx = the graphical element

          // console.log(event, 'on', e.element.id);
          // console.log(e.element.type);
          if (event === 'element.click' && !!e.element.id) {
            aid = e.element.id;
            atype = e.element.type;
            this.isAddButtonShown = this.isAddSubProcessButtonShown(this.maptoModel(aid, atype));
            console.log(this.isAddButtonShown);
          }
          
        });
      });

    this.bpmnJS.attachTo(this.el.nativeElement);


    this.loadDiagram(this.file);

    
  }

  ngOnChanges(changes: SimpleChanges) {
    // re-import whenever the url changes
    if (changes.file) {
      this.loadDiagram(changes.file.currentValue);
    }
  }

  ngOnDestroy(): void {
    this.bpmnJS.destroy();
  }

  loadDiagram(file: string): Subscription {
    this.overlays = this.bpmnJS.get('overlays');
    return (
      this.http.get('/assets/bpmn/_assets_bpmn_default.bpmn', { responseType: 'text' })
        .pipe(
          switchMap((xml: string) => this.importDiagram(xml)),
          map(result => result.warnings),
        ).subscribe(
          (warnings: any) => {
            this.importDone.emit({
              type: 'success',
              warnings
            });
            this.overlays.add('Activity_1iag6z7', 'note', {
              position: {
                bottom: 0,
                right: 0
              },
              html: '<div class="diagram-note">https://forum.bpmn.io/t/how-can-i-save-diagram-and-svg-in-angular/4498</div>'
              });
          },
          (err: any) => {
            this.importDone.emit({
              type: 'error',
              error: err
            });
          }
        )
    );
  }

  private importDiagram(xml: string): Observable<{ warnings: Array<any> }> {
    return from(this.bpmnJS.importXML(xml) as Promise<{ warnings: Array<any> }>);
  }

  public saveDiagram() {
    
  }

  getBpmnContent(): Promise<void> {
    var a = this.bpmnJS.get("elementRegistry")
    return this.bpmnJS.saveXML({ format: true });
  }

  getServiceTasks(): Observable<any> {
    return this.http.get('assets/bpmn/serviceTasks.json');
  }

  isAddSubProcessButtonShown(element: DiagramElement):boolean {
    if (element.type === 'bpmn:Process') {
      this.previousElementForAddSubPr = null;
      return false;
    }
      this.previousElementForAddSubPr = element;
      return true;
  }

  maptoModel(id: string, type: string): DiagramElement {
    this.currentElementForAddSubPr.id = id;
    this.currentElementForAddSubPr.type = type;
    return this.currentElementForAddSubPr;

  }
}
