;(function(){
    'use strict';
    var store = new PouchDB('todos');

    var todoApp = new Vue({
        // The element which hold the app
        el: '#todo-app',
        data: function(){
            return {
                // a variable to hold the new todo text
                newTodo: '',
                target: 0,
                newText: '',
                // variable which define if save the todos data
                saveTodosInBrowser: false,
                // the todos array
                todos: []
            }
        },
        methods: {
            // add todo method
            // the fallowing declaration is exactly the same:
            // addTodo: async function(){
            async addTodo(){
                // create an id based in the last id in the array
                let id = this.todos.length == 0 ? 1 : this.todos[this.todos.length - 1].id + 1;

                // the todo object, just two times the same id
                // (_id to save in the PouchDB database and id to sort and manage the object inside the array),
                // text (body) of the todo, and
                // done to define if is done or not
                let todo = {
                    _id: `${id}`,
                    id: id,
                    text: this.newTodo,
                    done: false
                };

                // insert the new todo into the todos array
                this.todos.push(todo);
                // set the newTodo property to a empty string,
                // this avoid to erase the text box when success (each time)
                this.newTodo = '';

                // if the user want to save in the database
                // this little block insert the new todo to it
                if (this.saveTodosInBrowser) {
                    await store.put(todo).catch(function(err){
                        if (err){
                            console.warn(err);
                        }
                    });
                }
            },
            // the todo remover method:
            // this get the id of the todo object to remove
            async removeTodo(id){
                // create a new temporal todo list
                let newTodoList = new Array();

                // fill the new list with the same content of the ald todo
                // except for the object which have the given id
                this.todos.forEach(function(todo){
                    if (todo.id != id){
                        newTodoList.push(todo);
                    }
                });

                // get the todos array void to fill with the new list
                this.todos = [];

                // fill the todos array with the new one inside a for loop
                for (let todo in newTodoList){
                    this.todos.push(newTodoList[todo]);
                }

                // in the database is easier 'cause just got to find the id owner and remove it
                if (this.saveTodosInBrowser) {
                    await store.get(id).then(function(doc){
                        store.remove(doc).catch(function (err) {
                            if (err) {
                                console.warn(err);
                            }
                        });;
                    }).catch(function(err){
                        if (err){
                            console.warn(err);
                        }
                    });
                }
            },
            // mark/unmark a todo as complete
            // literally just toggle the done value in the object which have the given id
            async todoCompleted(id){
                try {

                    // find the todo object by the id
                    this.todos.forEach(function (todo) {
                        if (todo.id == id) {
                            // toggle the done property
                            // with this statement it turns true if was false
                            // or false if it was true
                            todo.done = !todo.done;
                        }
                    });

                    // now create a holder to the todo element to manipulate it
                    let todoElement = document.getElementById(`todo-${id}`);
                    // an array whick hold three classes to toggle in the element's class list
                    let classes = ['t-gray', 'gray-pale', 'border-gray-pale'];
                    // toggle each class in a simple for loop
                    for (let cl in classes){
                        todoElement.classList.toggle(classes[cl]);
                    }
                    // set a line-through text decoration if the element have the gray-pale class
                    todoElement.style.textDecoration = todoElement.className.includes('gray-pale') ? 'line-through' : 'none';

                } catch (error) {
                    // This write a warning in the console for debugging reasons
                    console.warn('Was Imposible mark the todo as complete\nError catched: \n' + error);
                }

                if (this.saveTodosInBrowser) {
                    // by the same way before, here the document in the database is refreshed with the new value
                    await store.get(id).then(function(doc){
                        doc.done = !doc.done;
                        return doc;
                    }).then(function(doc){
                        store.put(doc);
                    }).catch(function (err) {
                        if (err) {
                            console.warn(err);
                        }
                    });;
                }
            },
            openTodoEditor(id) {
                this.target = id;
                document.querySelector('#prompt').style.display = 'block';
            },
            // the todo editor method
            async editTodo(id){
                document.querySelector('#prompt').style.display = 'none';
                let text = this.newText;
                this.todos.forEach(function(todo){
                    if (todo.id == id){
                        todo.text = text;
                    }
                });

                if (this.saveTodosInBrowser) {
                    // now, if user want to hold the data in the db, we save it there
                    await store.get(id).then(function (doc) {
                        doc.text = newText;
                        return doc;
                    }).then(function (doc) {
                        store.put(doc);
                    }).catch(function (err) {
                        if (err) {
                            console.warn(err);
                        }
                    });;
                }
            },
            // this return the id for a todo in the DOM
            todoId: function (id) {
                return 'todo-' + id;
            },
            // this return the title to be include in the todo inside the list in the DOM
            todoTitle: function(status){
                return status ? 'Completed' : 'Uncompleted yet';
            }
        }
    });

    // at the start, we look for the data inside the database
    store.allDocs({include_docs: true}).then(function(result){
        // if there if no data, there will be no change in the app's initial structure
        // if not the saveTodosInBrowser is set to true
        if (result.total_rows != 0){
            todoApp.saveTodosInBrowser = true;
        }
        // now we take the results,
        result.rows.forEach(function(doc){
            // if saveTodosInBrowser is true, we push each document to the todos object
            if(todoApp.saveTodosInBrowser){
                todoApp.todos.push(doc.doc);
            }else{
                // if not remove each one is inside the db, if exists
                store.remove(doc.doc);
            }
        });
    });
})();