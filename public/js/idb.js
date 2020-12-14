// create variable to hold db connection 

let db; 

//establish connection to indexed DB 
const request = indexedDB.open('budgetTracker', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store  
    db.createObjectStore('newTransaction', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function(event) {
    db = event.target.result;
  
    if(navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    //log error 
    console.log(event.target.errorCode);
}


// This function will be executed if we attempt to submit a new transaction with no connection to the internet 
function saveRecord(record) {
    //open new transaction with database with read and write permissions
    const transaction = db.transaction(['newTransaction'], 'readwrite');

    //access the object store for the 'newTransaction'
    const transactionObjectStore = transaction.objectStore('newTransaction');

    //add record to the object store with the add method
    transactionObjectStore.add(record);
}


function uploadTransaction() {
    //open a transaction on your db 
    const transaction = db.transaction(['newTransaction'], 'readwrite');

    //access your object store
    const transactionObjectStore = transaction.objectStore('newTransaction');

    //get all records from store and set to variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        //check if their is data in store and send to api server if there is 
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type' : 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse)
                }

                //open one more transaction
                const transaction = db.transaction(['newTransaction'], 'readwrite');

                //access the new transaction object transactionObjectStore
                const transactionObjectStore = transaction.objectStore('newTransaction');

                //clear all items in your store
                transactionObjectStore.clear();

                alert('All saved transaction has been submitted!');


            })
            .catch(err => {
                console.log(err)
            })
        }
    }

}

//listen for app coming back online
window.addEventListener('online', uploadTransaction);