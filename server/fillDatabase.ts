import { createItem } from './crud';
import { db } from './database';

// Function to generate a random number within a range
const getRandomInRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

// Function to generate random data
const generateRandomData = async (count: number): Promise<void> => {
    console.log(`Generating ${count} random data points...`);
    
    let lastTotal = 0;
    
    for (let i = 0; i < count; i++) {
        // Create a timestamp with some time variation
        const date = new Date();
        date.setMinutes(date.getMinutes() - i * 5); // Each record is 5 minutes apart
        const timestamp = date.toISOString();
        
        // Generate random values within realistic ranges
        const apower = getRandomInRange(50, 250); // Active power between 50W and 250W
        const voltage = getRandomInRange(210, 240); // Voltage between 210V and 240V
        const current = apower / voltage; // Current calculated from power and voltage
        
        // For total energy, we need to increment from the last value
        const incrementAmount = apower * (5/60); // Convert power (W) to energy (Wh) for 5 minutes
        lastTotal += incrementAmount;
        
        try {
            const result = await createItem(timestamp, apower, voltage, current, lastTotal);
            console.log(`Generated data point ${i+1}/${count} added, Id: ${result.id}`);
        } catch (error: any) {
            console.error(`Error adding data point ${i+1}/${count}: ${error.message}`);
        }
    }
    
    console.log(`Finished generating ${count} random data points`);
    
    // Close the database connection when done
    db.close((err: Error | null) => {
        if (err) {
            console.error(`Error closing database: ${err.message}`);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
};

// Number of data points to generate
const dataPointCount = 100;

// Generate the data
generateRandomData(dataPointCount)
    .catch((error) => {
        console.error(`Error generating data: ${error.message}`);
        process.exit(1);
    });
