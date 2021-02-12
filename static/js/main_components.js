Vue.component("modal",{props:["title"],template:"#modal-template",});Vue.component("autosize-textarea",{props:["value"],template:`<div:value=value class='autosize-textarea'></div>'`,
});

Vue.component("calendar", {
    props: ["id", "first_date"],
    template: "#calendar-template",
    data() {
        date = new Date(Date.parse(this.first_date) || new Date);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            days: getDays(date.getFullYear(), date.getMonth() + 1),
        }
    },
    methods: {
        getClassesDay(date) {
            classes = ["day"];
            classes.push(date.getMonth() + 1 == this.month ? 'active' : 'passive');
            classes.push(moment(date).format('L') == moment(new Date()).format('L') ? 'today' : '');
            return classes;
        },
        getUrlDay: (date) => `/diary/date.html?date=${moment(date).format('YYYY-MM-DD'