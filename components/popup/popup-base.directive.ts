import { ComponentRef, ElementRef, ViewContainerRef, ComponentFactoryResolver, HostListener } from "@angular/core";
import { PopupConfig, PopupTrigger } from "./popup-config";
import { SuiPopup } from "./popup";
import { SuiPopupConfig } from "./popup.service";

export interface IPopup {
    open():void;
    close():void;
    toggle():void;
}

export abstract class SuiPopupBaseDirective implements IPopup {
    // Stores reference to generated popup component.
    private _componentRef?:ComponentRef<SuiPopup>;

    // Returns generated popup instance.
    private get _popup():SuiPopup {
        // Use non-null assertion as we only access this when a popup exists.
        return this._componentRef!.instance;
    }

    // `setTimeout` timer pointer for delayed popup open.
    private _openingTimeout:number;

    constructor(private _element:ElementRef,
                private _viewContainerRef:ViewContainerRef,
                private _componentFactoryResolver:ComponentFactoryResolver,
                protected _popupConfig:PopupConfig) {
    }

    public open():void {
        // Cancel the opening timer.
        clearTimeout(this._openingTimeout);

        // Start the popup opening after the specified delay interval.
        this._openingTimeout = window.setTimeout(
            () => {
                if (!this._componentRef) {
                    // Resolve component factory for the `SuiPopup` component.
                    const factory = this._componentFactoryResolver.resolveComponentFactory(SuiPopup);

                    // Generate a component using the view container reference and the previously resolved factory.
                    this._componentRef = this._viewContainerRef.createComponent(factory);

                    // If there is a template, inject it into the view.
                    if (this._popupConfig.template) {
                        this._popup.templateSibling.createEmbeddedView(this._popupConfig.template, { $implicit: this._popup });
                    }

                    // Configure popup with provided config, and attach a reference to the anchor element.
                    this._popup.config = this._popupConfig;
                    this._popup.anchor = this._element;

                    // Move the generated element to the body to avoid any positioning issues.
                    document.querySelector("body")!.appendChild(this._componentRef.location.nativeElement);

                    // When the popup is closed (onClose fires on animation complete),
                    this._popup.onClose.subscribe(() => {
                        if (this._componentRef) {
                            // Destroy the component reference (which removes the popup from the DOM).
                            this._componentRef.destroy();
                            // Unset the reference pointer to enable a new popup to be created on next open.
                            this._componentRef = undefined;
                        }
                    });
                }

                // Start popup open transition.
                this._popup.open();

            },
            this._popupConfig.delay);
    }

    public close():void {
        // Cancel the opening timer to stop the popup opening after close has been called.
        clearTimeout(this._openingTimeout);

        if (this._componentRef) {
            // Start popup close transition.
            this._popup.close();
        }
    }

    public toggle():void {
        // If the popup hasn't been created, or it has but it isn't currently open, open the popup.
        if (!this._componentRef || (this._componentRef && !this._popup.isOpen)) {
            return this.open();
        }

        // O'wise, close it.
        return this.close();
    }

    @HostListener("mouseenter")
    private onMouseEnter():void {
        if (this._popupConfig.trigger === PopupTrigger.Hover) {
            this.open();
        }
    }

    @HostListener("mouseleave")
    private onMouseLeave():void {
        if (this._popupConfig.trigger === PopupTrigger.Hover) {
            this.close();
        }
    }

    @HostListener("click")
    private onClick():void {
        if (this._popupConfig.trigger === PopupTrigger.Click || this._popupConfig.trigger === PopupTrigger.OutsideClick) {
            // Repeated clicks require a toggle, rather than just opening the popup each time.
            this.toggle();
        }
    }

    @HostListener("document:click", ["$event"])
    public onDocumentClick(e:MouseEvent):void {
        // If the popup trigger is outside click,
        if (this._componentRef && this._popupConfig.trigger === PopupTrigger.OutsideClick) {
            const target = e.target as Element;
            // Close the popup if the click is outside of the popup element.
            if (!(this._element.nativeElement as Element).contains(target)) {
                this.close();
            }
        }
    }

    @HostListener("focus")
    private onFocus():void {
        if (this._popupConfig.trigger === PopupTrigger.Focus) {
            this.open();
        }
    }

    @HostListener("focusout")
    private onFocusOut():void {
        if (this._popupConfig.trigger === PopupTrigger.Focus) {
            this.close();
        }
    }
}
