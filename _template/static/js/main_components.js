Vue.component("modal", {
    props: ["title"],
    template: "#modal-template",
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
        getDayCls: function (date) {
            cls = ["day"];
            if (date.getMonth() + 1 == this.month) {
                cls.push("active");
            } else {
                cls.push("passive");
            };
            if (moment(date).format("L") == moment(new Date()).format("L")) {
                cls.push("today");
            };
            return cls;
        },
        getUrlDay: (date) => `{{ start_url }}/date.html?date=${moment(date).format('YYYY-MM-DD')}`,
        load() {
            this.days = getDays(this.year, this.month);
        },
    },
    computed: {
        title: vm => moment(`${vm.year}${vm.month}`, "YYYYMM").format("MMMM YYYY").toUpperCase(),
    },
});

function getDays(year, month) {
    const date = (year && month) ? new Date(year, month - 1, 1) : new Date();

    var date1 = new Date(date);
    date1.setDate(1);
    if (date1.getDay() != 1) {
        date1.setDate(0);
        date1.setDate(date1.getDate() - date1.getDay() + 1);
    };

    var date2 = new Date(date);
    date2.setMonth(date2.getMonth() + 1);
    date2.setDate(0);
    if (date2.getDay() != 0) {
        date2.setDate(date2.getDate() + 7 - date2.getDay());
    };

    let days = new Array();
    let i = 0;
    while (date1 <= date2) {
        if (Math.floor(i % 7) == 0);
        days.push([]);
        days[Math.floor(i / 7)].push(new Date(date1));
        date1.setDate(date1.getDate() + 1);
        i++;
    };
    days = days.filter(x => x.length);
    return days;
};