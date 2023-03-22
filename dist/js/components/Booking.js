import {templates, select, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from '../components/AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){
    const thisBooking = this; 
        
    thisBooking.render(element);
    thisBooking.initWidget();
    thisBooking.getData();
    thisBooking.initTables();
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam, 
        endDateParam
      ],
      eventsCurrent: [
        settings.db.notRepeatParam, 
        startDateParam, 
        endDateParam
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam
      ],
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking), 
      fetch(urls.eventsCurrent), 
      fetch(urls.eventsRepeat)])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(), 
          eventsCurrentResponse.json(), 
          eventsRepeatResponse.json()]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }


    thisBooking.updateDOM();
    //console.log('thisBooking.booked', thisBooking.booked);
  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      //console.log('loop', hourBlock);
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);

    }
  }
  updateDOM(){
    const thisBooking = this; 

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) > -1
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
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

    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);

    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.dom.submit = element.querySelector(select.booking.submit);
    thisBooking.dom.starters = element.querySelectorAll(select.booking.starters);
  
  }
  initTables(){
    const thisBooking = this;

    thisBooking.element.addEventListener('click', function(event){
      event.preventDefault();
      if(event.target.classList.contains('table')){

        if(!event.target.classList.contains(classNames.booking.tableBooked)){

          for(let table of thisBooking.dom.tables){
            if (table.classList.contains(classNames.booking.tableSelected) &&
            table !== event.target){
              table.classList.remove(classNames.booking.tableSelected);
            }
            if(event.target.classList.contains(classNames.booking.tableSelected)){
              event.target.classList.remove(classNames.booking.tableSelected);
            } else {
              event.target.classList.add(classNames.booking.tableSelected);
            } 
          }
        } else {
          alert('this table is already booked');
        } 
      }
    });

  }
  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;

    const payload = {
      date: thisBooking.date,
      hour: utils.numberToHour(thisBooking.hour),
      table: thisBooking.tableId,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      adress: thisBooking.dom.address.value,
    };

    for(let starter of thisBooking.dom.starters) {
      if(starter.checked){
        payload.starters.push(starter.value);
      }
    }


    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
      
    fetch(url, options)
      .then(function(response) {
        return response.json();
      }).then(function(parsedResponse) {
        console.log('parsedResponse: ', parsedResponse);
      });

  }

  initWidget() {
    const thisBooking = this;
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('click', function () {});
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('click', function () {});
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerInput);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPickerInput);

    thisBooking.dom.wrapper.addEventListener('updated', function(event){
      thisBooking.updateDOM();

      if (
        event.target == thisBooking.dom.hourPicker ||
        event.target == thisBooking.dom.datePicker ||
        event.target == thisBooking.dom.peopleAmount ||
        event.target == thisBooking.dom.hoursAmount
      ){
        thisBooking.selectedTable = {};
        for (let table of thisBooking.dom.tables){
          table.classList.remove(classNames.booking.tableSelected);
        }
      }
    });
    thisBooking.dom.submit.addEventListener('click', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
    
  }
}

export default Booking;