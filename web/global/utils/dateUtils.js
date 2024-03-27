Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

Date.prototype.addMonths = function (months) {
  let date = new Date(this.valueOf());
  date.setMonth(date.getMonth() + months);
  return date;
}

Date.prototype.addYears = function (years) {
  let date = new Date(this.valueOf());
  date.setFullYear(date.getFullYear() + years);
  return date;
}

const dateUtils = {
  getDateISOString(dateTime) {
    return dateTime.getFullYear() + '-' + (dateTime.getMonth() > 8 ? (dateTime.getMonth() + 1) : '0' + (dateTime.getMonth() + 1)) + '-' + (dateTime.getDate() > 9 ? dateTime.getDate() : ('0' + dateTime.getDate()));
  }

  , getDateTimeISOString(dateTime, timePartStr) {
    return this.getDateISOString(dateTime) + 'T' + timePartStr;
  }

  , getStartOfDayTimeISOString() {
    return '00:00:00.000Z';
  }

  , getEndOfDayTimeISOString() {
    return '23:59:59.999Z';
  }

  , getDateTimeStartISOString(dateTime) {
    return this.getDateTimeISOString(dateTime, this.getStartOfDayTimeISOString());
  }

  , getDateTimeEndISOString(dateTime) {
    return this.getDateTimeISOString(dateTime, this.getEndOfDayTimeISOString());
  }

  , getWeekStartDate(dateTime) {
    return dateTime.addDays(0 - dateTime.getDay() + 1);
  }

  , getWeekEndDate(dateTime) {
    return this.getWeekStartDate(dateTime).addDays(6);
  }

  , getStartOfWeekISOString(dateTime) {
    return this.getDateTimeISOString(this.getWeekStartDate(dateTime), this.getStartOfDayTimeISOString());
  }

  , getEndOfWeekISOString(dateTime) {
    return this.getDateTimeISOString(this.getWeekEndDate(dateTime), this.getEndOfDayTimeISOString());
  }

  , getStartOfLastWeekISOString(dateTime) {
    return this.getDateTimeISOString(this.getWeekStartDate(dateTime).addDays(-7), this.getStartOfDayTimeISOString());
  }

  , getEndOfLastWeekISOString(dateTime) {
    return this.getDateTimeISOString(this.getWeekEndDate(dateTime).addDays(-7), this.getEndOfDayTimeISOString());
  }

  , getMonthStartDate(dateTime) {
    return new Date(dateTime.getFullYear(), dateTime.getMonth(), 1);
  }

  , getMonthEndDate(dateTime) {
    return this.getMonthStartDate(dateTime).addMonths(1).addDays(-1);
  }

  , getStartOfMonthISOString(dateTime) {
    return this.getDateTimeISOString(this.getMonthStartDate(dateTime), this.getStartOfDayTimeISOString());
  }

  , getEndOfMonthISOString(dateTime) {
    return this.getDateTimeISOString(this.getMonthEndDate(dateTime), this.getEndOfDayTimeISOString());
  }

  , getStartOfLastMonthISOString(dateTime) {
    return this.getDateTimeISOString(this.getMonthStartDate(dateTime).addMonths(-1), this.getStartOfDayTimeISOString());
  }

  , getEndOfLastMonthISOString(dateTime) {
    return this.getDateTimeISOString(this.getMonthStartDate(dateTime).addDays(-1), this.getEndOfDayTimeISOString());
  }

  , getYearStartDate(dateTime) {
    return new Date(dateTime.getFullYear(), 0, 1);
  }

  , getYearEndDate(dateTime) {
    return this.getYearStartDate(dateTime).addYears(1).addDays(-1);
  }

  , getStartOfYearISOString(dateTime) {
    return this.getDateTimeISOString(this.getYearStartDate(dateTime), this.getStartOfDayTimeISOString());
  }

  , getEndOfYearISOString(dateTime) {
    return this.getDateTimeISOString(this.getYearEndDate(dateTime), this.getEndOfDayTimeISOString());
  }

  , getStartOfLastYearISOString(dateTime) {
    return this.getDateTimeISOString(this.getYearStartDate(dateTime).addYears(-1), this.getStartOfDayTimeISOString());
  }

  , getEndOfLastYearISOString(dateTime) {
    return this.getDateTimeISOString(this.getYearEndDate(dateTime).addYears(-1), this.getEndOfDayTimeISOString());
  }

}

export default dateUtils;
