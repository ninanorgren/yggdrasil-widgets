# Onbeat widget

Widget for displaying courses registered in Onbeat on external websites. 

### Setup

Add the following code snippets to your own website:

Insert the below snippet where on the website you want the widget to be: 
``` 
<div class="onbeat-widget" id="onbeat-widget-container"></div>
```

Place this code snippet in the bottom or top of your code:

```
<script src="https://ninanorgren.github.io/yggdrasil-widgets/course_widget.js"></script>
    <script>
        OnbeatCourseWidget({
            container: '#onbeat-widget-container',
            course_type: ['all'],
            public_token: 'bf5RUFJKh7r2TIpNRSZTJewVdfFP-rh1gOK6coG3tUQ',
            description: false
        }).catch((error) => {
            console.error('OnbeatCourseWidget failed to initialise', error);
        });
    </script>
```

The following parameters are customizable for the widget:

* course_id: \<int\> Displays one course only, defined by id. Takes presedence over course_type if both are defined
* course_type: \<list\> Displays all courses of one or more types. Types can be: 'courses', 'events', 'all'
* public_token: \<str\> Required to select courses from a specified club
* description: \<bool\> Show the first 4 lines of the course description. Defaults to true