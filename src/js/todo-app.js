var store = new PouchDB('todos');

var todoApp = new Vue({
    el: '#todo-app',
    data: function(){
        return {
            newTodo: '',
            saveTodosInBrowser: false,
            todos: []
        }
    },
    methods: {
        async addTodo(){
            let id = this.todos.length == 0 ? 1 : this.todos[this.todos.length - 1].id + 1;

            let todo = {
                _id: `${id}`,
                id: id,
                text: this.newTodo,
                done: false
            };

            this.todos.push(todo);
            this.newTodo = '';

            if (this.saveTodosInBrowser) {
                await store.put(todo);
            }
        },
        async removeTodo(id){
            let newTodoList = new Array();

            this.todos.forEach(function(todo){
                if (todo.id != id){
                    newTodoList.push(todo);
                }
            });

            this.todos = [];

            for (let todo in newTodoList){
                this.todos.push(newTodoList[todo]);
            }

            if (this.saveTodosInBrowser) {
                await store.get(id).then(function(doc){
                    store.remove(doc);
                });
            }
        },
        async todoCompleted(id){
            try {

                this.todos.forEach(function (todo) {
                    if (todo.id == id) {
                        todo.done = !todo.done;
                    }
                });

                let todoElement = document.getElementById(`todo-${id}`);
                let classes = ['t-gray', 'gray-pale', 'border-gray-pale'];
                for (let cl in classes){
                    todoElement.classList.toggle(classes[cl]);
                }
                todoElement.style.textDecoration = todoElement.className.includes('gray-pale') ? 'line-through' : 'none';

            } catch (error) {
                console.warn('Was Imposible mark the todo as complete, maybe, you\'ve removed the todo?\nError catched: \n' + error);
            }

            if (this.saveTodosInBrowser) {
                await store.get(id).then(function(doc){
                    doc.done = !doc.done;
                    return doc;
                }).then(function(doc){
                    store.put(doc);
                });
            }
        },
        async editTodo(id){
            let newText = prompt('Write the new content to the TODO');
            this.todos.forEach(function(todo){
                if (todo.id == id){
                    todo.text = newText;
                }
            });

            if (this.saveTodosInBrowser) {
                await store.get(id).then(function (doc) {
                    doc.text = newText;
                    return doc;
                }).then(function (doc) {
                    store.put(doc);
                });
            }
        },
        todoId: function (id) {
            return 'todo-' + id;
        },
        todoTitle: function(status){
            return status ? 'Completed' : 'Uncompleted yet';
        },
        updateStore: function(){
            let todoItems = new Array();
        }
    }
});

store.allDocs({include_docs: true}).then(function(result){
    if (result.total_rows != 0){
        todoApp.saveTodosInBrowser = true;
    }
    result.rows.forEach(function(doc){
        if(todoApp.saveTodosInBrowser){
            todoApp.todos.push(doc.doc);
        }else{
            store.remove(doc.doc);
        }
    });
});