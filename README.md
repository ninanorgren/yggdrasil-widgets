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
<script src="https://cdn.jsdelivr.net/npm/onbeat-course-widget/dist/course_widget.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            OnbeatCourseWidget({
                container: '#onbeat-widget-container',
                course_type: ['all'],
                public_token: 'YOUR_PUBLIC_TOKEN',
                description: true,
                show_closed: true,
                card_width: "80%",
                card_align: "center"
            });
        });
    </script>
```


The following parameters are customizable for the widget:

* course_id: \<int\> Displays one course only, defined by id. Takes presedence over course_type if both are defined
* course_type: \<list\> Displays all courses of one or more types. Types can be: 'courses', 'events', 'all'
* public_token: \<str\> Required to select courses from a specified club
* description: \<bool\> Show the first 4 lines of the course description. Defaults to true
* show_closed: \<bool\> Show courses where the registration is closed. Defaults to false
* card_align: \<str\> Alignment of cards on page. Valid options are 'left', 'center', 'right'. Defaults to 'left'

