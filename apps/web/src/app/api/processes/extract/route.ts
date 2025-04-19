import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { extractProcessModelFromDocuments } from 'ai-service';
import { v4 as uuidv4 } from 'uuid';
import { getProcesses, createProcess } from 'database';
import { authOptions } from '../../../lib/auth';

/**
 * POST /api/processes/extract
 * Extract process models from documents
 * 
 * Request body:
 * {
 *   documentIds: string[],  // IDs of documents to extract from
 *   processName: string     // Name of the new process model
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { documentIds, processName } = body;
    
    // Validate inputs
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'One or more document IDs are required' },
        { status: 400 }
      );
    }
    
    if (!processName) {
      return NextResponse.json(
        { error: 'Process name is required' },
        { status: 400 }
      );
    }
    
    // Extract process model from documents
    const { processModel, confidenceScores, errors } = await extractProcessModelFromDocuments(
      documentIds,
      session.user.id
    );
    
    // Check if there were critical errors
    if (errors.length > 0 && !processModel) {
      return NextResponse.json(
        { error: 'Failed to extract process model', errors },
        { status: 500 }
      );
    }
    
    // Set the process name and creator
    processModel.name = processName;
    processModel.createdBy = session.user.id;
    processModel.updatedBy = session.user.id;
    
    // Save the process model to the database
    const savedProcess = await createProcess({
      id: processModel.id || uuidv4(),
      name: processModel.name,
      description: processModel.description,
      createdBy: session.user.id,
      nodesData: JSON.stringify(processModel.nodes),
      edgesData: JSON.stringify(processModel.edges)
    });
    
    // Return the extracted process model
    return NextResponse.json({
      process: savedProcess,
      confidenceScores,
      warnings: errors.length > 0 ? errors : undefined
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error extracting process model:', error);
    return NextResponse.json(
      { error: 'Failed to extract process model', message: (error as Error).message },
      { status: 500 }
    );
  }
} 