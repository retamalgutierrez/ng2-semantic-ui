
import {
    Directive, ElementRef, ViewContainerRef, ComponentFactoryResolver, ComponentRef,
    Renderer2, EventEmitter, Output, HostBinding, Input, HostListener
} from "@angular/core";
import { SuiPopupComponentController } from "../../popup/classes/popup-component-controller";
import { PopupConfig, PopupTrigger } from "../../popup/classes/popup-config";
import { PositioningPlacement } from "../../util/services/positioning.service";
import { SuiComponentFactory } from "../../util/services/component-factory.service";
import { SuiDatepicker, DatepickerMode } from "../components/datepicker";
import { customValueAccessorFactory, CustomValueAccessor, ICustomValueAccessorHost } from "../../util/helpers/custom-value-accessor";
import { CalendarViewType } from "../views/calendar-view";
import { Util, KeyCode } from "../../util/util";
import { PopupAfterOpen } from "../../popup/classes/popup-lifecycle";
import { CalendarService } from "../services/calendar.service";
import { CalendarConfig, YearConfig, MonthConfig, DatetimeConfig, TimeConfig, DateConfig } from "../classes/calendar-config";

@Directive({
    selector: "[suiDatepicker]"
})
export class SuiDatepickerDirective
       extends SuiPopupComponentController<SuiDatepicker>
       implements ICustomValueAccessorHost<Date>, PopupAfterOpen {

    private _selectedDate?:Date;

    public get selectedDate():Date | undefined {
        return this._selectedDate;
    }

    public set selectedDate(date:Date | undefined) {
        this._selectedDate = date;
        this.onDateChange.emit(date);
    }

    private _mode:DatepickerMode;
    public config:CalendarConfig;

    @Input("pickerMode")
    public get mode():DatepickerMode | undefined {
        return this._mode;
    }

    public set mode(mode:DatepickerMode | undefined) {
        if (mode) {
            this._mode = mode;
        }
        switch (mode) {
            case DatepickerMode.Year:
                this.config = new YearConfig();
                break;
            case DatepickerMode.Month:
                this.config = new MonthConfig();
                break;
            case DatepickerMode.Date:
            default:
                this.config = new DateConfig();
                break;
            case DatepickerMode.Datetime:
                this.config = new DatetimeConfig();
                break;
            case DatepickerMode.Time:
                this.config = new TimeConfig();
                break;
        }
    }

    @Input("pickerMaxDate")
    public maxDate?:Date;

    @Input("pickerMinDate")
    public minDate?:Date;

    @Input("pickerFirstDayOfWeek")
    public firstDayOfWeek?:number;

    @Output("dateChange")
    public onDateChange:EventEmitter<Date>;

    @Input("pickerPlacement")
    public set placement(placement:PositioningPlacement) {
        this.popup.config.placement = placement;
    }

    constructor(element:ElementRef,
                public renderer:Renderer2,
                componentFactory:SuiComponentFactory) {

        super(element, componentFactory, SuiDatepicker, new PopupConfig({
            trigger: PopupTrigger.Focus,
            placement: PositioningPlacement.BottomLeft
        }));

        // This ensures the popup is drawn correctly (i.e. no border).
        this.renderer.addClass(this.popup.elementRef.nativeElement, "ui");
        this.renderer.addClass(this.popup.elementRef.nativeElement, "calendar");
        this.onDateChange = new EventEmitter<Date>();
    }

    public popupOnOpen():void {
        if (this.componentInstance) {
            this.componentInstance.config = this.config;
            this.componentInstance.selectedDate = this.selectedDate;
            this.componentInstance.maxDate = this.maxDate;
            this.componentInstance.minDate = this.minDate;
            this.componentInstance.firstDayOfWeek = this.firstDayOfWeek;

            this.componentInstance.service.reset();

            this.componentInstance.onDateChange.subscribe((d:Date) => {
                this.selectedDate = d;
                this.close();
            });
        }
    }

    public writeValue(value:Date | undefined):void {
        this.selectedDate = value;

        if (this.componentInstance) {
            this.componentInstance.selectedDate = value;
        }
    }

    @HostListener("keydown", ["$event"])
    public onKeyDown(e:KeyboardEvent):void {
        if (e.keyCode === KeyCode.Escape) {
            this.close();
        }
    }
}

@Directive({
    selector: "[suiDatepicker]",
    host: {
        "(dateChange)": "onChange($event)"
    },
    providers: [customValueAccessorFactory(SuiDatepickerDirectiveValueAccessor)]
})
export class SuiDatepickerDirectiveValueAccessor extends CustomValueAccessor<Date, SuiDatepickerDirective> {
    constructor(public host:SuiDatepickerDirective) {
        super(host);
    }
}
