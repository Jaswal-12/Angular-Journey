import { detectIntent } from "../services/intentService.js";
import { askGemini } from "../services/vertexService.js";

import {
  createSession, 
  getSession,
  saveAnswer
} from "../services/sessionService.js";

import { insuranceQuestions } from "../data/insuranceQuestions.js";


export const askAI = async (req, res) => {

  try {

    const { message, sessionId } = req.body;


    if (!message) {

      return res.status(400).json({

        success:false,

        message:"Message is required"

      });

    }



    // ==========================================
    // NEW CHAT - INTENT DETECTION
    // ==========================================

    if (!sessionId) {


      const intent = await detectIntent(message);


      console.log("Detected Intent:", intent);



      // BUY POLICY FLOW

      if (intent === "BUY_POLICY") {


        const session = await createSession();



        return res.json({

          success:true,

          sessionId:session.sessionId,

          question:insuranceQuestions[0].question

        });


      }



      // ======================================
      // NORMAL GEMINI CHAT RESPONSE
      // ======================================


      const aiReply = await askGemini(message);



      return res.json({

        success:true,

        aiResponse:aiReply

      });


    }





    // ==========================================
    // EXISTING FORM SESSION
    // ==========================================


    const session = await getSession(sessionId);



    if(!session){

      return res.status(404).json({

        success:false,

        message:"Session not found"

      });

    }





    const currentQuestion =
      insuranceQuestions[
        session.currentQuestionIndex
      ];




    // Save answer

    await saveAnswer(

      sessionId,

      currentQuestion.id,

      message

    );




    const updatedSession =
      await getSession(sessionId);





    // ==========================================
    // FORM COMPLETE
    // ==========================================


    if(
      updatedSession.currentQuestionIndex >=
      insuranceQuestions.length
    ){

      return res.json({

        success:true,

        completed:true,

        answers:updatedSession.answers

      });

    }





    // ==========================================
    // NEXT FORM QUESTION
    // ==========================================


    const nextQuestion =
      insuranceQuestions[
        updatedSession.currentQuestionIndex
      ];




    return res.json({

      success:true,

      sessionId,

      question:nextQuestion.question

    });





  } catch(error){


    console.error(
      "AI Controller Error:",
      error
    );



    return res.status(500).json({

      success:false,

      message:"Something went wrong",

      error:error.message

    });


  }

};
