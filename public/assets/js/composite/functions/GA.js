export const GA = {
    track: (args) => {
        var obj = args
        const defaults = {
            hitType: 'event',
            eventCategory: 'unknown_category',
            eventAction: 'button_press',
            eventLabel: 'unknown_label'
        }

        for (var key in defaults) {
            if (typeof (obj[key]) === 'undefined') {
                obj[key] = defaults[key]
            }
        }
        try {
            ga('send', obj)
        } catch (e) {
            // console.log(e)
        }
    }
}
