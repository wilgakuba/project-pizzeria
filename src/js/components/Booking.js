import {templates, select} from '../settings.js';
import AmountWidget from '../components/AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){
    const thisBooking = this; 
        
    thisBooking.render(element);
    thisBooking.initWidget();
  }
  render(element){
    const thisBooking = this; 

    thisBooking.element = element;

    thisBooking.dom = {
      wrapper: thisBooking.element,
    };


    const generatedHTML = templates.bookingWidget();

    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.element.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePickerInput = thisBooking.element.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPickerInput = thisBooking.element.querySelector(select.widgets.hourPicker.wrapper);

  }
  initWidget() {
    const thisBooking = this;
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('click', function () {});
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('click', function () {});
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerInput);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPickerInput);
  }
}

export default Booking;